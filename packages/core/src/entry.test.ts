import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { TestClock } from "effect/testing";

import {
  answerPrompt,
  configLayer,
  createPrompt,
  LocalDate,
  Measure,
  PromptExpiredError,
  readEntry,
  TokenDateMismatchError,
} from "#core";
import type { EntryInput, LocalDate as LocalDateType } from "#core";

import { withTestDatabase } from "./test-support/sqlite.ts";

const environment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};
const sentAt = Date.parse("2024-06-11T01:00:00Z");
const day = 24 * 60 * 60 * 1_000;
const sevenDays = 7 * day;

const entryForDate = (date: LocalDateType, overrides: Partial<EntryInput> = {}): EntryInput => ({
  date,
  mood: Measure(5),
  energy: Measure(6),
  sleep: Measure(7),
  ...overrides,
});

// @attests root/token/authorises-one-date
it.effect("refuses a token used for another local date", () =>
  withTestDatabase((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      const error = yield* answerPrompt(prompt.token, entryForDate(LocalDate("2024-06-11"))).pipe(Effect.flip);
      const entriesBefore = database.raw.prepare("SELECT count(*) AS count FROM entries").get();
      const promptBefore = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);
      yield* answerPrompt(prompt.token, entryForDate(prompt.date));

      assert.instanceOf(error, TokenDateMismatchError);
      assert.deepEqual(entriesBefore, { count: 0 });
      assert.deepEqual(promptBefore, { answered_at: null });
      assert.deepEqual(database.raw.prepare("SELECT count(*) AS count FROM entries").get(), { count: 1 });
    }).pipe(Effect.provide(configLayer(environment))),
  ),
);

// @attests root/token/survives-answering
it.effect("uses one token to replace an answer before expiry", () =>
  withTestDatabase(() =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(2) }));
      yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(9) }));
      const entry = Option.getOrThrow(yield* readEntry(prompt.date));
      assert.strictEqual(entry.mood, 9);
    }).pipe(Effect.provide(configLayer(environment))),
  ),
);

// @attests root/prompt/expires-after-seven-days
it.effect("accepts a token before expiry and refuses it at or after seven days", () =>
  withTestDatabase((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* TestClock.setTime(sentAt + sevenDays - 1);
      yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(4) }));
      yield* TestClock.setTime(sentAt + sevenDays);
      const atExpiry = yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(8) })).pipe(
        Effect.flip,
      );
      yield* TestClock.setTime(sentAt + 8 * day);
      const afterExpiry = yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(9) })).pipe(
        Effect.flip,
      );
      const entry = yield* readEntry(prompt.date);
      const storedPrompt = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);

      assert.instanceOf(atExpiry, PromptExpiredError);
      assert.instanceOf(afterExpiry, PromptExpiredError);
      assert.strictEqual(Option.getOrThrow(entry).mood, 4);
      assert.deepEqual(storedPrompt, { answered_at: sentAt + sevenDays - 1 });
    }).pipe(Effect.provide(configLayer(environment))),
  ),
);

// @attests root/entry/one-per-local-date
it.effect("keeps one row after two writes for one local date", () =>
  withTestDatabase((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(3) }));
      yield* answerPrompt(prompt.token, entryForDate(prompt.date, { mood: Measure(8) }));
      assert.deepEqual(database.raw.prepare("SELECT count(*) AS count FROM entries").get(), { count: 1 });
    }).pipe(Effect.provide(configLayer(environment))),
  ),
);

// @attests root/entry/measures-are-one-to-ten
it.effect("rejects measures below one and above ten", () =>
  withTestDatabase((database) =>
    Effect.sync(() => {
      const fields = ["mood", "energy", "sleep"] as const;
      const invalidValues = [0, 11, 5.5];
      let attempt = 0;
      for (const field of fields) {
        for (const invalidValue of invalidValues) {
          const values = { energy: 5, mood: 5, sleep: 5, [field]: invalidValue };
          const date = `2024-06-${String(10 + attempt).padStart(2, "0")}`;
          const insert = database.raw.prepare("INSERT INTO entries (date, mood, energy, sleep) VALUES (?, ?, ?, ?)");
          assert.throws(() => insert.run(date, values.mood, values.energy, values.sleep));
          attempt += 1;
        }
      }
    }),
  ),
);

// @attests root/entry/last-write-wins
it.effect("returns the measures from the last write", () =>
  withTestDatabase(() =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(
        prompt.token,
        entryForDate(prompt.date, {
          energy: Measure(2),
          mood: Measure(1),
          sleep: Measure(3),
        }),
      );
      yield* answerPrompt(
        prompt.token,
        entryForDate(prompt.date, {
          energy: Measure(8),
          mood: Measure(9),
          sleep: Measure(7),
        }),
      );
      const entry = Option.getOrThrow(yield* readEntry(prompt.date));
      assert.strictEqual(entry.energy, 8);
      assert.strictEqual(entry.mood, 9);
      assert.strictEqual(entry.sleep, 7);
    }).pipe(Effect.provide(configLayer(environment))),
  ),
);

// @attests root/entry/note-round-trips
it.effect("returns a note unchanged and accepts an entry without one", () =>
  withTestDatabase(() => {
    const note = `First line\n"it's fine" 🌱`;
    return Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const firstPrompt = yield* createPrompt;
      yield* answerPrompt(firstPrompt.token, entryForDate(firstPrompt.date, { note }));
      const withNote = yield* readEntry(firstPrompt.date);

      yield* TestClock.setTime(sentAt + day);
      const secondPrompt = yield* createPrompt;
      yield* answerPrompt(secondPrompt.token, entryForDate(secondPrompt.date));
      const withoutNote = yield* readEntry(secondPrompt.date);

      assert.strictEqual(Option.getOrThrow(withNote).note, note);
      assert.isUndefined(Option.getOrThrow(withoutNote).note);
    }).pipe(Effect.provide(configLayer(environment)));
  }),
);

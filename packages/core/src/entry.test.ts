import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { TestClock } from "effect/testing";

import {
  CheckIn,
  EntryRead,
  LocalDate,
  Measure,
  PromptExpiredError,
  PromptWrite,
  Timestamp,
  TokenDateMismatchError,
} from "#core";
import type { EntryInput, LocalDate as LocalDateType, Prompt } from "#core";

import { withTestCapabilities } from "./test-support/sqlite.ts";

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

/**
 * A prompt that has been sent, which is the only kind that authorises anything. The two steps
 * are separate in production because a send can fail between them; every test below wants the
 * pair, so they are spelled once here.
 */
const sentPrompt = (date: LocalDateType, at: number): Effect.Effect<Prompt, never, PromptWrite> =>
  Effect.gen(function* () {
    const prompts = yield* PromptWrite;
    const prompt = yield* prompts.open(date, Timestamp(at));
    yield* prompts.markSent(date, Timestamp(at));
    return { ...prompt, sentAt: Timestamp(at) };
  }).pipe(Effect.orDie);

const today = LocalDate("2024-06-10");

// @attests root/token/authorises-one-date
it.effect("refuses a token used for another local date", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const prompt = yield* sentPrompt(today, sentAt);
      const error = yield* checkIn.answer(prompt.token, entryForDate(LocalDate("2024-06-11"))).pipe(Effect.flip);
      const entriesBefore = database.raw.prepare("SELECT count(*) AS count FROM entries").get();
      const promptBefore = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date));

      assert.instanceOf(error, TokenDateMismatchError);
      assert.deepEqual(entriesBefore, { count: 0 });
      assert.deepEqual(promptBefore, { answered_at: null });
      assert.deepEqual(database.raw.prepare("SELECT count(*) AS count FROM entries").get(), { count: 1 });
    }),
  ),
);

// @attests root/token/survives-answering
it.effect("uses one token to replace an answer before expiry", () =>
  withTestCapabilities(() =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const entries = yield* EntryRead;
      const prompt = yield* sentPrompt(today, sentAt);
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date, { mood: Measure(2) }));
      yield* TestClock.setTime(sentAt + sevenDays - 1);
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date, { mood: Measure(9) }));
      const entry = Option.getOrThrow(yield* entries.forDate(prompt.date));
      assert.strictEqual(entry.mood, 9);
    }),
  ),
);

// @attests root/prompt/expires-after-seven-days
it.effect("accepts a token before expiry and refuses it at or after seven days", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const entries = yield* EntryRead;
      const prompt = yield* sentPrompt(today, sentAt);
      yield* TestClock.setTime(sentAt + sevenDays - 1);
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date, { mood: Measure(4) }));
      yield* TestClock.setTime(sentAt + sevenDays);
      const atExpiry = yield* checkIn
        .answer(prompt.token, entryForDate(prompt.date, { mood: Measure(8) }))
        .pipe(Effect.flip);
      yield* TestClock.setTime(sentAt + 8 * day);
      const afterExpiry = yield* checkIn
        .answer(prompt.token, entryForDate(prompt.date, { mood: Measure(9) }))
        .pipe(Effect.flip);
      const entry = yield* entries.forDate(prompt.date);
      const storedPrompt = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);

      assert.instanceOf(atExpiry, PromptExpiredError);
      assert.instanceOf(afterExpiry, PromptExpiredError);
      assert.strictEqual(Option.getOrThrow(entry).mood, 4);
      assert.deepEqual(storedPrompt, { answered_at: sentAt + sevenDays - 1 });
    }),
  ),
);

// @attests root/prompt/expires-after-seven-days
it.effect("measures expiry from the send time, not from the creation time", () =>
  withTestCapabilities(() =>
    Effect.gen(function* () {
      // A prompt created at the top of the day and sent nine hours later expires nine hours
      // later too. Under `0001_core.sql` there was one timestamp and the distinction could not
      // be drawn; a retry after a failed send is exactly the case that draws it.
      yield* TestClock.setTime(sentAt);
      const prompts = yield* PromptWrite;
      const checkIn = yield* CheckIn;
      const prompt = yield* prompts.open(today, Timestamp(sentAt));

      yield* TestClock.setTime(sentAt + 9 * 60 * 60 * 1_000);
      yield* prompts.markSent(today, Timestamp(sentAt + 9 * 60 * 60 * 1_000));

      const entries = yield* EntryRead;
      yield* TestClock.setTime(sentAt + sevenDays + 1);
      yield* checkIn.answer(prompt.token, entryForDate(today, { mood: Measure(6) }));
      assert.strictEqual(Option.getOrThrow(yield* entries.forDate(today)).mood, 6);

      yield* TestClock.setTime(sentAt + 9 * 60 * 60 * 1_000 + sevenDays);
      const atExpiry = yield* checkIn.answer(prompt.token, entryForDate(today, { mood: Measure(7) })).pipe(Effect.flip);
      assert.instanceOf(atExpiry, PromptExpiredError);
    }),
  ),
);

// @attests root/entry/one-per-local-date
it.effect("keeps one row after two writes for one local date", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const prompt = yield* sentPrompt(today, sentAt);
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date, { mood: Measure(3) }));
      yield* checkIn.answer(prompt.token, entryForDate(prompt.date, { mood: Measure(8) }));
      assert.deepEqual(database.raw.prepare("SELECT count(*) AS count FROM entries").get(), { count: 1 });
    }),
  ),
);

// @attests root/entry/measures-are-one-to-ten
it.effect("rejects measures below one and above ten", () =>
  withTestCapabilities((database) =>
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
  withTestCapabilities(() =>
    Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const entries = yield* EntryRead;
      const prompt = yield* sentPrompt(today, sentAt);
      yield* checkIn.answer(
        prompt.token,
        entryForDate(prompt.date, {
          energy: Measure(2),
          mood: Measure(1),
          sleep: Measure(3),
        }),
      );
      const firstEntry = Option.getOrThrow(yield* entries.forDate(prompt.date));
      assert.strictEqual(firstEntry.energy, 2);
      assert.strictEqual(firstEntry.mood, 1);
      assert.strictEqual(firstEntry.sleep, 3);

      yield* checkIn.answer(
        prompt.token,
        entryForDate(prompt.date, {
          energy: Measure(8),
          mood: Measure(9),
          sleep: Measure(7),
        }),
      );
      const entry = Option.getOrThrow(yield* entries.forDate(prompt.date));
      assert.strictEqual(entry.energy, 8);
      assert.strictEqual(entry.mood, 9);
      assert.strictEqual(entry.sleep, 7);
    }),
  ),
);

// @attests root/entry/note-round-trips
it.effect("returns a note unchanged and accepts an entry without one", () =>
  withTestCapabilities(() => {
    const note = `First line\n"it's fine" 🌱`;
    return Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const checkIn = yield* CheckIn;
      const entries = yield* EntryRead;
      const firstPrompt = yield* sentPrompt(today, sentAt);
      yield* checkIn.answer(firstPrompt.token, entryForDate(firstPrompt.date, { note }));
      const withNote = yield* entries.forDate(firstPrompt.date);

      yield* TestClock.setTime(sentAt + day);
      const secondPrompt = yield* sentPrompt(LocalDate("2024-06-11"), sentAt + day);
      yield* checkIn.answer(secondPrompt.token, entryForDate(secondPrompt.date));
      const withoutNote = yield* entries.forDate(secondPrompt.date);

      assert.strictEqual(Option.getOrThrow(withNote).note, note);
      assert.isUndefined(Option.getOrThrow(withoutNote).note);
    });
  }),
);

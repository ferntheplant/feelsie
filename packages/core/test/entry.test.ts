import { Effect, Option } from "effect";
import { TestClock } from "effect/testing";
import { expect, test } from "vite-plus/test";

import {
  answerPrompt,
  configLayer,
  createPrompt,
  Database,
  PromptExpiredError,
  readEntry,
  TokenDateMismatchError,
} from "#core";
import type { EntryInput } from "#core";

import { makeTestDatabase } from "./support/sqlite.ts";

const environment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};
const sentAt = Date.parse("2024-06-11T01:00:00Z");
const day = 24 * 60 * 60 * 1_000;

const measures = (date: string, overrides: Partial<EntryInput> = {}): EntryInput => ({
  date,
  mood: 5,
  energy: 6,
  sleep: 7,
  ...overrides,
});

// @attests core/token/authorises-one-date
test("refuses a token used for another local date", async () => {
  const database = makeTestDatabase();
  try {
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      const error = yield* answerPrompt(prompt.token, measures("2024-06-11")).pipe(Effect.flip);
      const entriesBefore = database.raw.prepare("SELECT count(*) AS count FROM entries").get();
      const promptBefore = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);
      yield* answerPrompt(prompt.token, measures(prompt.date));
      return { entriesBefore, error, promptBefore };
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    const result = await Effect.runPromise(program);
    expect(result.error).toBeInstanceOf(TokenDateMismatchError);
    expect(result.entriesBefore).toEqual({ count: 0 });
    expect(result.promptBefore).toEqual({ answered_at: null });
    expect(database.raw.prepare("SELECT count(*) AS count FROM entries").get()).toEqual({ count: 1 });
  } finally {
    database.raw.close();
  }
});

// @attests core/token/survives-answering
test("uses one token to replace an answer before expiry", async () => {
  const database = makeTestDatabase();
  try {
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 2 }));
      yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 9 }));
      return yield* readEntry(prompt.date);
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    const entry = Option.getOrThrow(await Effect.runPromise(program));
    expect(entry.mood).toBe(9);
  } finally {
    database.raw.close();
  }
});

// @attests core/prompt/expires-after-seven-days
test("accepts a token before expiry and refuses it at or after seven days", async () => {
  const database = makeTestDatabase();
  try {
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* TestClock.setTime(prompt.expiresAt - 1);
      yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 4 }));
      yield* TestClock.setTime(sentAt + 7 * day);
      const atExpiry = yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 8 })).pipe(Effect.flip);
      yield* TestClock.setTime(sentAt + 8 * day);
      const afterExpiry = yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 9 })).pipe(Effect.flip);
      const entry = yield* readEntry(prompt.date);
      const storedPrompt = database.raw.prepare("SELECT answered_at FROM prompts WHERE token = ?").get(prompt.token);
      return { afterExpiry, atExpiry, entry, storedPrompt };
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    const errors = await Effect.runPromise(program);
    expect(errors.atExpiry).toBeInstanceOf(PromptExpiredError);
    expect(errors.afterExpiry).toBeInstanceOf(PromptExpiredError);
    expect(Option.getOrThrow(errors.entry).mood).toBe(4);
    expect(errors.storedPrompt).toEqual({ answered_at: sentAt + 7 * day - 1 });
  } finally {
    database.raw.close();
  }
});

// @attests core/entry/one-per-local-date
test("keeps one row after two writes for one local date", async () => {
  const database = makeTestDatabase();
  try {
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 3 }));
      yield* answerPrompt(prompt.token, measures(prompt.date, { mood: 8 }));
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    await Effect.runPromise(program);
    expect(database.raw.prepare("SELECT count(*) AS count FROM entries").get()).toEqual({ count: 1 });
  } finally {
    database.raw.close();
  }
});

// @attests core/entry/measures-are-one-to-ten
test("rejects measures below one and above ten", () => {
  const database = makeTestDatabase();
  try {
    const fields = ["mood", "energy", "sleep"] as const;
    const invalidValues = [0, 11, 5.5];
    let attempt = 0;
    for (const field of fields) {
      for (const invalidValue of invalidValues) {
        const values = { energy: 5, mood: 5, sleep: 5, [field]: invalidValue };
        const date = `2024-06-${String(10 + attempt).padStart(2, "0")}`;
        const insert = database.raw.prepare("INSERT INTO entries (date, mood, energy, sleep) VALUES (?, ?, ?, ?)");
        expect(() => insert.run(date, values.mood, values.energy, values.sleep)).toThrow();
        attempt += 1;
      }
    }
  } finally {
    database.raw.close();
  }
});

// @attests core/entry/last-write-wins
test("returns the measures from the last write", async () => {
  const database = makeTestDatabase();
  try {
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const prompt = yield* createPrompt;
      yield* answerPrompt(prompt.token, measures(prompt.date, { energy: 2, mood: 1, sleep: 3 }));
      yield* answerPrompt(prompt.token, measures(prompt.date, { energy: 8, mood: 9, sleep: 7 }));
      return yield* readEntry(prompt.date);
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    expect(Option.getOrThrow(await Effect.runPromise(program))).toMatchObject({ energy: 8, mood: 9, sleep: 7 });
  } finally {
    database.raw.close();
  }
});

// @attests core/entry/note-round-trips
test("returns a note unchanged and accepts an entry without one", async () => {
  const database = makeTestDatabase();
  try {
    const note = `First line\n"it's fine" 🌱`;
    const program = Effect.gen(function* () {
      yield* TestClock.setTime(sentAt);
      const firstPrompt = yield* createPrompt;
      yield* answerPrompt(firstPrompt.token, measures(firstPrompt.date, { note }));
      const withNote = yield* readEntry(firstPrompt.date);

      yield* TestClock.setTime(sentAt + day);
      const secondPrompt = yield* createPrompt;
      yield* answerPrompt(secondPrompt.token, measures(secondPrompt.date));
      const withoutNote = yield* readEntry(secondPrompt.date);
      return { withNote, withoutNote };
    }).pipe(
      Effect.provideService(Database, database.service),
      Effect.provide(configLayer(environment)),
      Effect.provide(TestClock.layer()),
    );

    const entries = await Effect.runPromise(program);
    expect(Option.getOrThrow(entries.withNote).note).toBe(note);
    expect(Option.getOrThrow(entries.withoutNote).note).toBeUndefined();
  } finally {
    database.raw.close();
  }
});

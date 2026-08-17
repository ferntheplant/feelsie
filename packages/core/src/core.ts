import { Clock, DateTime, Effect, Option } from "effect";

import { CoreConfig } from "./config.ts";
import { Database, type SqlRow } from "./database.ts";
import { DatabaseError, PromptExpiredError, PromptNotFoundError, TokenDateMismatchError } from "./errors.ts";
import type { Entry, EntryInput, LocalTime, Prompt } from "./model.ts";

const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1_000;

const encodeBase64Url = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const generateToken: Effect.Effect<string> = Effect.sync(() => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
});

const localTimeAt = (now: number, timeZone: string): LocalTime => {
  const zoned = DateTime.setZone(DateTime.makeUnsafe(now), DateTime.zoneMakeNamedUnsafe(timeZone));
  const parts = DateTime.toParts(zoned);
  return {
    date: DateTime.formatIsoDate(zoned),
    hour: parts.hour,
  };
};

export const currentLocalTime: Effect.Effect<LocalTime, never, CoreConfig> = Effect.gen(function* () {
  const config = yield* CoreConfig;
  const now = yield* Clock.currentTimeMillis;
  return localTimeAt(now, config.timeZone);
});

export const isSendHour: Effect.Effect<boolean, never, CoreConfig> = Effect.gen(function* () {
  const config = yield* CoreConfig;
  const localTime = yield* currentLocalTime;
  return localTime.hour === config.sendHour;
});

export const senderAddress = (localPart: string): Effect.Effect<string, never, CoreConfig> =>
  Effect.gen(function* () {
    const config = yield* CoreConfig;
    return `${localPart}@${config.mailDomain}`;
  });

const decodePrompt = (row: SqlRow): Effect.Effect<Prompt, DatabaseError> =>
  Effect.try({
    try: () => {
      const answeredAt = row.answered_at;
      const date = row.date;
      const expiresAt = row.expires_at;
      const sentAt = row.sent_at;
      const token = row.token;

      if (
        typeof date !== "string" ||
        typeof token !== "string" ||
        typeof sentAt !== "number" ||
        typeof expiresAt !== "number" ||
        (answeredAt !== null && answeredAt !== undefined && typeof answeredAt !== "number")
      ) {
        throw new TypeError("The prompt row has an invalid shape.");
      }

      return {
        date,
        token,
        sentAt,
        expiresAt,
        ...(typeof answeredAt === "number" ? { answeredAt } : {}),
      };
    },
    catch: (cause) => new DatabaseError({ cause, operation: "decode prompt" }),
  });

const decodeEntry = (row: SqlRow): Effect.Effect<Entry, DatabaseError> =>
  Effect.try({
    try: () => {
      const date = row.date;
      const energy = row.energy;
      const mood = row.mood;
      const note = row.note;
      const sleep = row.sleep;

      if (
        typeof date !== "string" ||
        typeof mood !== "number" ||
        typeof energy !== "number" ||
        typeof sleep !== "number" ||
        (note !== null && note !== undefined && typeof note !== "string")
      ) {
        throw new TypeError("The entry row has an invalid shape.");
      }

      return {
        date,
        mood,
        energy,
        sleep,
        ...(typeof note === "string" ? { note } : {}),
      };
    },
    catch: (cause) => new DatabaseError({ cause, operation: "decode entry" }),
  });

export const createPrompt: Effect.Effect<Prompt, DatabaseError, CoreConfig | Database> = Effect.gen(function* () {
  const config = yield* CoreConfig;
  const database = yield* Database;
  const sentAt = yield* Clock.currentTimeMillis;
  const localTime = localTimeAt(sentAt, config.timeZone);
  const token = yield* generateToken;
  const prompt = {
    date: localTime.date,
    token,
    sentAt,
    expiresAt: sentAt + sevenDaysInMilliseconds,
  } satisfies Prompt;

  yield* database.batch([
    {
      text: "INSERT INTO prompts (date, token, sent_at, expires_at) VALUES (?, ?, ?, ?)",
      parameters: [prompt.date, prompt.token, prompt.sentAt, prompt.expiresAt],
    },
  ]);

  return prompt;
});

export const answerPrompt = (
  token: string,
  entry: EntryInput,
): Effect.Effect<Entry, DatabaseError | PromptExpiredError | PromptNotFoundError | TokenDateMismatchError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const row = yield* database.first({
      text: "SELECT date, token, sent_at, expires_at, answered_at FROM prompts WHERE token = ?",
      parameters: [token],
    });

    if (Option.isNone(row)) {
      return yield* new PromptNotFoundError();
    }

    const prompt = yield* decodePrompt(row.value);
    const now = yield* Clock.currentTimeMillis;

    if (now >= prompt.expiresAt) {
      return yield* new PromptExpiredError({ expiresAt: prompt.expiresAt });
    }

    if (entry.date !== prompt.date) {
      return yield* new TokenDateMismatchError({
        authorisedDate: prompt.date,
        requestedDate: entry.date,
      });
    }

    yield* database.batch([
      {
        text: `INSERT INTO entries (date, mood, energy, sleep, note)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            mood = excluded.mood,
            energy = excluded.energy,
            sleep = excluded.sleep,
            note = excluded.note`,
        parameters: [entry.date, entry.mood, entry.energy, entry.sleep, entry.note ?? null],
      },
      {
        text: "UPDATE prompts SET answered_at = COALESCE(answered_at, ?) WHERE token = ?",
        parameters: [now, token],
      },
    ]);

    return entry;
  });

export const readEntry = (date: string): Effect.Effect<Option.Option<Entry>, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const row = yield* database.first({
      text: "SELECT date, mood, energy, sleep, note FROM entries WHERE date = ?",
      parameters: [date],
    });
    return yield* Option.match(row, {
      onNone: () => Effect.succeed(Option.none<Entry>()),
      onSome: (value) => decodeEntry(value).pipe(Effect.map(Option.some)),
    });
  });

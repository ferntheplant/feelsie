// Every operation the rest of the system performs, written against the `Database` service.
//
// **Nothing here is exported from the package.** `capabilities.ts` wraps these into narrow
// capability services and that is the only way in. The reason is a type witness two apps
// need: a handler typed `Effect<Response, E, CheckInFormRead>` must be unable to write, and
// narrowing `DatabaseShape` does not achieve that — `first` takes arbitrary statement text
// and runs it, so `INSERT … RETURNING` writes through a "read-only" handle. The narrowing has
// to happen above the SQL, which means the SQL never leaves this file.
import { Clock, DateTime, Effect, Option } from "effect";

import type { CheckInFormData } from "./capabilities.ts";
import { CoreConfig } from "./config.ts";
import { Database, type SqlRow } from "./database.ts";
import { DatabaseError, PromptExpiredError, PromptNotFoundError, TokenDateMismatchError } from "./errors.ts";
import { LocalDate, Measure, Timestamp, Token } from "./model.ts";
import type { EntryInput, LocalTime, Prompt } from "./model.ts";

const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1_000;

const encodeBase64Url = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const generateToken: Effect.Effect<Token> = Effect.sync(() => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Token(encodeBase64Url(bytes));
});

const localTimeAt = (now: number, timeZone: string): LocalTime => {
  const zoned = DateTime.setZone(DateTime.makeUnsafe(now), DateTime.zoneMakeNamedUnsafe(timeZone));
  const parts = DateTime.toParts(zoned);
  return {
    date: LocalDate(DateTime.formatIsoDate(zoned)),
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

/**
 * The instant a sent prompt stops being answerable. Derived rather than stored: it was always
 * `sent_at + seven days`, and `0002_prompt_send_lifecycle.sql` dropped the column that held a
 * second copy of it.
 */
export const expiresAt = (prompt: Prompt): Option.Option<Timestamp> =>
  prompt.sentAt === undefined ? Option.none() : Option.some(Timestamp(prompt.sentAt + sevenDaysInMilliseconds));

const decodePrompt = (row: SqlRow): Effect.Effect<Prompt, DatabaseError> =>
  Effect.try({
    try: () => {
      const answeredAt = row.answered_at;
      const createdAt = row.created_at;
      const date = row.date;
      const sentAt = row.sent_at;
      const token = row.token;

      const isNullableNumber = (value: unknown): value is number | null | undefined =>
        value === null || value === undefined || typeof value === "number";

      if (
        typeof date !== "string" ||
        typeof token !== "string" ||
        typeof createdAt !== "number" ||
        !isNullableNumber(sentAt) ||
        !isNullableNumber(answeredAt)
      ) {
        throw new TypeError("The prompt row has an invalid shape.");
      }

      return {
        date: LocalDate(date),
        token: Token(token),
        createdAt: Timestamp(createdAt),
        ...(typeof sentAt === "number" ? { sentAt: Timestamp(sentAt) } : {}),
        ...(typeof answeredAt === "number" ? { answeredAt: Timestamp(answeredAt) } : {}),
      };
    },
    catch: (cause) => new DatabaseError({ cause, operation: "decode prompt" }),
  });

const decodeEntry = (row: SqlRow): Effect.Effect<EntryInput, DatabaseError> =>
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
        date: LocalDate(date),
        mood: Measure(mood),
        energy: Measure(energy),
        sleep: Measure(sleep),
        ...(typeof note === "string" ? { note } : {}),
      };
    },
    catch: (cause) => new DatabaseError({ cause, operation: "decode entry" }),
  });

const selectPrompt = "SELECT date, token, created_at, sent_at, answered_at FROM prompts";

const promptForDate = (date: LocalDate): Effect.Effect<Option.Option<Prompt>, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const row = yield* database.first({ text: `${selectPrompt} WHERE date = ?`, parameters: [date] });
    return yield* Option.match(row, {
      onNone: () => Effect.succeed(Option.none<Prompt>()),
      onSome: (value) => decodePrompt(value).pipe(Effect.map(Option.some)),
    });
  });

const promptForToken = (token: Token): Effect.Effect<Option.Option<Prompt>, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const row = yield* database.first({ text: `${selectPrompt} WHERE token = ?`, parameters: [token] });
    return yield* Option.match(row, {
      onNone: () => Effect.succeed(Option.none<Prompt>()),
      onSome: (value) => decodePrompt(value).pipe(Effect.map(Option.some)),
    });
  });

/**
 * The prompt for a local date, creating it if there is none. Idempotent by the primary key
 * rather than by a read-then-write, so two fires racing on one local date cannot both insert:
 * the loser's `ON CONFLICT DO NOTHING` is a no-op and the following read returns the winner's
 * row. The generated token is discarded in that case, which costs nothing.
 */
export const openPrompt = (
  date: LocalDate,
  at: Timestamp,
): Effect.Effect<Prompt, DatabaseError | PromptNotFoundError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const token = yield* generateToken;

    yield* database.batch([
      {
        text: "INSERT INTO prompts (date, token, created_at) VALUES (?, ?, ?) ON CONFLICT(date) DO NOTHING",
        parameters: [date, token, at],
      },
    ]);

    const prompt = yield* promptForDate(date);
    // The row was just written or already existed, so `none` means the write did not land.
    // Failing here rather than returning an Option keeps the caller from treating a lost
    // insert as "no prompt today" and sending nothing for the rest of the day.
    return yield* Option.match(prompt, {
      onNone: () => Effect.fail(new PromptNotFoundError()),
      onSome: Effect.succeed,
    });
  });

/**
 * Records that the prompt's send returned. `COALESCE` keeps the first send time: a second
 * successful send for one local date is already prevented by the handler, and if one ever
 * happened it must not move the expiry of a token already sitting in an inbox.
 */
export const markPromptSent = (date: LocalDate, at: Timestamp): Effect.Effect<void, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    yield* database.batch([
      {
        text: "UPDATE prompts SET sent_at = COALESCE(sent_at, ?) WHERE date = ?",
        parameters: [at, date],
      },
    ]);
  });

/**
 * Records a send that did not return, with its reason. Nothing outside the handler can observe
 * a failed send — Alchemy's cron event source reports the invocation as successful either way —
 * so this row is the only trace the failure leaves.
 */
export const recordSendFailure = (
  date: LocalDate,
  at: Timestamp,
  attemptId: string,
  reason: string,
): Effect.Effect<void, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    yield* database.batch([
      {
        text: `INSERT INTO send_failures (date, failed_at, attempt_id, reason) VALUES (?, ?, ?, ?)
          ON CONFLICT(attempt_id) DO UPDATE SET reason = excluded.reason`,
        parameters: [date, at, attemptId, reason],
      },
    ]);
  });

export const answerPrompt = (
  token: Token,
  entry: EntryInput,
): Effect.Effect<
  EntryInput,
  DatabaseError | PromptExpiredError | PromptNotFoundError | TokenDateMismatchError,
  Database
> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const found = yield* promptForToken(token);

    if (Option.isNone(found)) {
      return yield* new PromptNotFoundError();
    }

    const prompt = found.value;
    const expiry = expiresAt(prompt);
    const now = yield* Clock.currentTimeMillis;

    // An unsent prompt has no expiry because its token never left the building. Refusing it as
    // "not found" is not a euphemism: from a caller's side there is no difference between a
    // token that was never issued and one that was never delivered.
    if (Option.isNone(expiry)) {
      return yield* new PromptNotFoundError();
    }

    if (now >= expiry.value) {
      return yield* new PromptExpiredError({ expiresAt: expiry.value });
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

export const readEntry = (date: LocalDate): Effect.Effect<Option.Option<EntryInput>, DatabaseError, Database> =>
  Effect.gen(function* () {
    const database = yield* Database;
    const row = yield* database.first({
      text: "SELECT date, mood, energy, sleep, note FROM entries WHERE date = ?",
      parameters: [date],
    });
    return yield* Option.match(row, {
      onNone: () => Effect.succeed(Option.none<EntryInput>()),
      onSome: (value) => decodeEntry(value).pipe(Effect.map(Option.some)),
    });
  });

/** The whole read interface for the public form: a token chooses the only entry it can return. */
export const readCheckInForm = (token: Token): Effect.Effect<Option.Option<CheckInFormData>, DatabaseError, Database> =>
  Effect.gen(function* () {
    const prompt = yield* promptForToken(token);
    if (Option.isNone(prompt)) {
      return Option.none();
    }

    const entry = yield* readEntry(prompt.value.date);
    return Option.some({ prompt: prompt.value, entry });
  });

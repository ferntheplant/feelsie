// The scheduled handler's witnesses.
//
// Every assertion here is about the send or about what the send left behind in the database.
// None is about the invocation: `CronEventSourceLive` swallows the handler's failure, so "the
// fire completed" is true when the send threw, and a witness built on it attests nothing. See
// `prototypes/cron-send-email-spike/` and F1.
import { assert, it } from "@effect/vitest";
import { withTestCapabilities } from "@feelsie/core/test-support";
import type { TestDatabase } from "@feelsie/core/test-support";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";
import { TestClock } from "effect/testing";

import { Mailer, mailerLayer } from "./mailer.ts";
import { sendDailyPrompt } from "./schedule.ts";
import { localDay, localHour, testConfig, testMailer } from "./test-support.ts";

const hoursOfTheDay = Array.from({ length: 24 }, (_, hour) => hour);

const countPrompts = (database: TestDatabase): unknown =>
  database.raw.prepare("SELECT count(*) AS count FROM prompts").get();

const promptRow = (database: TestDatabase): unknown =>
  database.raw.prepare("SELECT date, sent_at FROM prompts WHERE date = ?").get(localDay);

const failureRows = (database: TestDatabase): ReadonlyArray<unknown> =>
  database.raw.prepare("SELECT date, reason FROM send_failures ORDER BY seq").all();

// @attests root/checkin/prompt/reuses-one-prompt-until-success
it.effect("creates one prompt and stops after a returned send is recorded", () =>
  withTestCapabilities((database) => {
    const mailer = testMailer();
    return Effect.gen(function* () {
      // The hour is held fixed on purpose. It is what isolates idempotency from the schedule: a
      // handler that sends once only because one hour of twenty-four matched cannot pass this.
      yield* TestClock.setTime(localHour(21));
      for (let run = 0; run < 5; run += 1) {
        yield* sendDailyPrompt;
      }

      assert.deepEqual(countPrompts(database), { count: 1 });
      assert.strictEqual(mailer.sent.length, 1);
      assert.strictEqual(mailer.attempts.length, 1);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/checkin/prompt/reuses-one-prompt-until-success
// @attests root/checkin/prompt/attempts-start-at-the-send-hour
it.effect("sends once across a whole simulated local day, at the configured hour", () =>
  withTestCapabilities((database) => {
    const mailer = testMailer();
    const sentAfterHour: number[] = [];
    return Effect.gen(function* () {
      for (const hour of hoursOfTheDay) {
        yield* TestClock.setTime(localHour(hour));
        yield* sendDailyPrompt;
        if (mailer.sent.length === 1 && sentAfterHour.length === 0) {
          sentAfterHour.push(hour);
        }
      }

      assert.deepEqual(countPrompts(database), { count: 1 });
      assert.strictEqual(mailer.sent.length, 1);
      // Not "a send happened" but "a send happened at 21". The duplicate this covers arrives
      // from a different hour rather than from a retry, which the fixed-hour test cannot see.
      assert.deepEqual(sentAfterHour, [21]);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/checkin/prompt/attempts-start-at-the-send-hour
it.effect("follows the configured send hour rather than a fixed one", () =>
  withTestCapabilities(() => {
    const mailer = testMailer();
    const sentAfterHour: number[] = [];
    return Effect.gen(function* () {
      for (const hour of hoursOfTheDay) {
        yield* TestClock.setTime(localHour(hour));
        yield* sendDailyPrompt;
        if (mailer.sent.length === 1 && sentAfterHour.length === 0) {
          sentAfterHour.push(hour);
        }
      }

      // This is the witness that attests the claim alone, and it is the one a handler with the
      // fixture's 21 hardcoded fails: the day-long run above would still pass for it.
      assert.deepEqual(sentAfterHour, [6]);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig({ SEND_HOUR: "6" })));
  }),
);

// @attests root/checkin/prompt/attempts-start-at-the-send-hour
it.effect("never attempts a send before the send hour, and keeps trying after it", () =>
  withTestCapabilities(() => {
    // Refuses everything, so nothing is ever marked sent and every hour of the day is free to
    // try. What it attempts is then exactly the set of hours the gate admits.
    const mailer = testMailer(() => "the binding refused");
    const attemptedAt: number[] = [];
    return Effect.gen(function* () {
      for (const hour of hoursOfTheDay) {
        const attemptsBefore = mailer.attempts.length;
        yield* TestClock.setTime(localHour(hour));
        yield* sendDailyPrompt;
        if (mailer.attempts.length > attemptsBefore) {
          attemptedAt.push(hour);
        }
      }

      assert.strictEqual(mailer.sent.length, 0);
      // 21, 22, 23 — never earlier, and the retry runs out with the local date rather than
      // going quiet after one attempt. An email at 3am is the failure this half prevents; a
      // transient blip costing the whole day is the failure the other half prevents.
      assert.deepEqual(attemptedAt, [21, 22, 23]);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/checkin/prompt/attempts-start-at-the-send-hour
it.effect("attempts on the first fire after the send hour when the exact-hour fire was missed", () =>
  withTestCapabilities(() => {
    const mailer = testMailer();
    return Effect.gen(function* () {
      yield* TestClock.setTime(localHour(22));
      yield* sendDailyPrompt;
      assert.strictEqual(mailer.attempts.length, 1);
      assert.strictEqual(mailer.sent.length, 1);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/checkin/prompt/records-a-failed-send
it.effect("records a refused send with its reason", () =>
  withTestCapabilities((database) => {
    return Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      yield* sendDailyPrompt;

      // Nothing outside the handler can see this failure. The event source reports the fire as
      // a success, Cloudflare's retry never engages, and the metric `docs/gotchas.md` warns
      // about does not move. This row is the only trace.
      assert.deepEqual(failureRows(database), [
        { date: localDay, reason: "email from prompt@mail.example.com not allowed" },
      ]);
    }).pipe(
      Effect.provide(
        mailerLayer({
          send: () =>
            Effect.fail(
              new Cloudflare.Email.SendEmailError({ message: "email from prompt@mail.example.com not allowed" }),
            ),
        }),
      ),
      Effect.provide(testConfig()),
    );
  }),
);

// @attests root/checkin/prompt/records-a-failed-send
// @attests root/checkin/prompt/reuses-one-prompt-until-success
// @attests root/checkin/prompt/attempts-start-at-the-send-hour
it.effect("leaves a refused prompt unsent, and the next fire sends the same token", () =>
  withTestCapabilities((database) => {
    const mailer = testMailer((attempt) => (attempt === 1 ? "transient" : undefined));
    return Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      yield* sendDailyPrompt;
      const afterFailure = promptRow(database);

      yield* TestClock.setTime(localHour(22));
      yield* sendDailyPrompt;

      // A prompt wrongly marked sent here would suppress every retry for the date, and one
      // transient failure would cost the whole day.
      assert.deepEqual(afterFailure, { date: localDay, sent_at: null });
      assert.deepEqual(promptRow(database), { date: localDay, sent_at: localHour(22) });
      assert.strictEqual(mailer.sent.length, 1);
      // The same token, because the prompt was reopened rather than replaced — the link in the
      // second email is the one the first would have carried.
      assert.strictEqual(mailer.attempts[0]?.text, mailer.attempts[1]?.text);
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/checkin/prompt/records-a-failed-send
it.effect("records no failure when the send returns, and marks the prompt sent", () =>
  withTestCapabilities((database) => {
    const mailer = testMailer();
    return Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      yield* sendDailyPrompt;

      // The opposite polarity. A handler that recorded a failure on every run satisfies both
      // prohibitions above and is useless, and nothing above would catch it.
      assert.deepEqual(failureRows(database), []);
      assert.deepEqual(promptRow(database), { date: localDay, sent_at: localHour(21) });
    }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig()));
  }),
);

// @attests root/prompt/expires-after-seven-days
it.effect("records the send time after the send returns", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      yield* sendDailyPrompt;
      assert.deepEqual(promptRow(database), { date: localDay, sent_at: localHour(21) + 10 * 60 * 1_000 });
    }).pipe(
      Effect.provide(
        Layer.succeed(Mailer, {
          send: () => TestClock.adjust("10 minutes"),
        }),
      ),
      Effect.provide(testConfig()),
    ),
  ),
);

// @attests root/checkin/email/sender-follows-the-configured-domain
it.effect("sends from an address built from the configured mail domain", () =>
  Effect.gen(function* () {
    const sentFrom = (mailDomain: string) =>
      withTestCapabilities(() => {
        const mailer = testMailer();
        return Effect.gen(function* () {
          yield* TestClock.setTime(localHour(21));
          yield* sendDailyPrompt;
          return mailer.sent.map((message) => message.from);
        }).pipe(Effect.provide(mailer.layer), Effect.provide(testConfig({ MAIL_DOMAIN: mailDomain })));
      });

    // Observed on the send, not on `senderAddress`. Exercising `core`'s helper in isolation
    // would attest `core` and leave the connection to this Worker unwitnessed — the
    // production-path gap A005's coverage audit found twice.
    const first = yield* sentFrom("mail.first.example");
    const second = yield* sentFrom("mail.second.example");

    assert.deepEqual(first, ["prompt@mail.first.example"]);
    assert.deepEqual(second, ["prompt@mail.second.example"]);
  }),
);

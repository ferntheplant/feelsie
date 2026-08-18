// The daily send, as the cron fires it.
//
// The trigger is `0 * * * *` — hourly, with the decision made here rather than in the
// expression. `docs/rationale/the-cron-runs-every-hour.md` has the argument: cron triggers are
// UTC, the send hour is local, and the offset between them moves twice a year.
//
// **Three claims live in the twenty lines below, and the order of the steps is what carries
// them.**
//
// - `root/checkin/prompt/reuses-one-prompt-until-success` — opening is idempotent on the local
//   date's primary key, so every retry carries the same token. Once a returned send is recorded,
//   the `sentAt` check stops later fires.
// - `root/checkin/prompt/attempts-start-at-the-send-hour` — nothing happens before the send
//   hour. The first fire at or after it attempts the prompt, and later fires retry until one
//   returns or the local date ends.
// - `root/checkin/prompt/records-a-failed-send` — the send's failure is recorded here or it is
//   observed nowhere. `CronEventSourceLive` wraps every handler in
//   `Effect.catchCause(() => Effect.void)`, so Cloudflare never sees a failed invocation, its
//   retry never engages, and `controller.noRetry()` is moot. The daily mail can stop going out
//   with every platform signal reading normal. The evidence is
//   `prototypes/cron-send-email-spike/`.

import { CoreConfig, currentLocalTime, PromptWrite, Timestamp } from "@feelsie/core";
import type { DatabaseError, PromptNotFoundError } from "@feelsie/core";
import { Clock, Effect } from "effect";

import type { CheckinConfig } from "./config.ts";
import { Mailer } from "./mailer.ts";
import { promptMessage } from "./message.ts";

/**
 * What one fire of the cron does. Named and exported because it is the value the Worker mounts
 * and the value the witnesses run: a test that reconstructed the sequence itself would attest
 * the test, and the one thing this handler must not be is a second implementation.
 */
export const sendDailyPrompt: Effect.Effect<
  void,
  DatabaseError | PromptNotFoundError,
  CheckinConfig | CoreConfig | Mailer | PromptWrite
> = Effect.gen(function* () {
  const config = yield* CoreConfig;
  const mailer = yield* Mailer;
  const prompts = yield* PromptWrite;
  const localTime = yield* currentLocalTime;

  if (localTime.hour < config.sendHour) {
    return;
  }

  const now = Timestamp(yield* Clock.currentTimeMillis);
  const prompt = yield* prompts.open(localTime.date, now);

  // Already sent for this local date. Twenty-three of the day's twenty-four fires end here,
  // which is the cost `the-cron-runs-every-hour.md` accepts, and they are free.
  if (prompt.sentAt !== undefined) {
    return;
  }

  const message = yield* promptMessage(prompt.token);
  const attemptId = yield* Effect.sync(() => crypto.randomUUID());

  yield* mailer.send(message).pipe(
    Effect.matchEffect({
      // Not marked sent, so the next fire of this local date opens the same prompt and tries the
      // same token again. A prompt wrongly marked here would suppress every retry for the date
      // and cost the whole day, silently.
      onFailure: (error) => prompts.recordFailure(localTime.date, now, attemptId, error.reason),
      onSuccess: () =>
        Effect.flatMap(Clock.currentTimeMillis, (sentAt) => prompts.markSent(localTime.date, Timestamp(sentAt))),
    }),
  );
});

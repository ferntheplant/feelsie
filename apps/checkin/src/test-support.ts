// What the witnesses stand on.
//
// **The mailer stub records sends, never invocations.** That distinction is the whole of F1's
// finding: Alchemy's cron event source reports a fire whose send threw as `{"outcome":"ok"}`, so
// a test that counted completed handler runs would pass with zero mail going out. `sent` below
// grows only after `send` has returned, which is the same thing the local email simulator's
// on-disk message is, one layer further down.

import { configLayer } from "@feelsie/core";
import { Effect, Layer } from "effect";

import { CheckinConfig, checkinEnvironmentVariables } from "./config.ts";
import { MailSendError } from "./errors.ts";
import { Mailer } from "./mailer.ts";
import type { MailMessage } from "./mailer.ts";

export interface TestMailer {
  /** Every message `send` was called with, in order — including the ones that failed. */
  readonly attempts: ReadonlyArray<MailMessage>;
  /** Only the messages whose send returned. */
  readonly sent: ReadonlyArray<MailMessage>;
  readonly layer: Layer.Layer<Mailer>;
}

/**
 * A `Mailer` that refuses when `refuse` returns a reason for the attempt number, and otherwise
 * accepts. Attempt-indexed rather than always-on so that "the next fire tries again" is a case a
 * test can actually construct.
 */
export const testMailer = (refuse: (attempt: number) => string | undefined = () => undefined): TestMailer => {
  const attempts: MailMessage[] = [];
  const sent: MailMessage[] = [];

  return {
    attempts,
    sent,
    layer: Layer.succeed(Mailer, {
      send: (message) =>
        Effect.suspend(() => {
          attempts.push(message);
          const reason = refuse(attempts.length);
          if (reason !== undefined) {
            return Effect.fail(new MailSendError({ reason }));
          }
          sent.push(message);
          return Effect.void;
        }),
    }),
  };
};

const testEnvironment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
  [checkinEnvironmentVariables.inboxAddress]: "inbox@example.com",
  [checkinEnvironmentVariables.origin]: "https://checkin.example.com",
} as const;

/**
 * Both configuration layers, from a record shaped like the Worker's environment. Overrides are
 * how the "change the configured value" witnesses change one thing and nothing else.
 */
export const testConfig = (overrides: Record<string, string> = {}) => {
  const environment = { ...testEnvironment, ...overrides };
  return Layer.mergeAll(
    Layer.orDie(configLayer(environment)),
    Layer.succeed(CheckinConfig, {
      inboxAddress: environment[checkinEnvironmentVariables.inboxAddress],
      origin: environment[checkinEnvironmentVariables.origin],
    }),
  );
};

/** The UTC instant at which it is `hour` on 2024-06-11 in `America/New_York`. */
export const localHour = (hour: number): number => Date.parse("2024-06-11T00:00:00-04:00") + hour * 60 * 60 * 1_000;

export const localDay = "2024-06-11";

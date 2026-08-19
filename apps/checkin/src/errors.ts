import { Data } from "effect";

/** A configured value this Worker needs that is missing or unusable. */
export class CheckinConfigError extends Data.TaggedError("CheckinConfigError")<{
  readonly field: string;
  readonly value: string;
}> {}

/**
 * A send that did not return. The reason is carried because it is the only thing recorded
 * about the failure — Alchemy's cron event source discards the handler's failure, so nothing
 * downstream ever sees this value again.
 */
export class MailSendError extends Data.TaggedError("MailSendError")<{
  readonly reason: string;
}> {}

// The capability the scheduled handler sends through, and the last place in this repository
// that an address is a value rather than a wire.
//
// It exists as a service for one reason, and it is the reason F1's spike recorded: a send that
// fails inside a scheduled handler is invisible. `CronEventSourceLive` wraps every handler in
// `Effect.catchCause(() => Effect.void)`, so the invocation reports success either way — which
// means a witness must observe **the send**, and observing the send means the send has a seam a
// witness can stand at. `Mailer` is that seam. Its production layer is built in `worker.ts`
// over `Cloudflare.Email.Send`; the binding is what actually validates and delivers.
import { RuntimeContext } from "alchemy";
import type * as Cloudflare from "alchemy/Cloudflare";
import type { Effect } from "effect";
import { Context, Effect as EffectApi, Layer } from "effect";

import { MailSendError } from "./errors.ts";

export interface MailMessage {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

interface MailerShape {
  /**
   * Sends, and returns only when the send returned. The failure is typed rather than a defect
   * because the handler has to act on it — recording it is the whole of
   * `root/checkin/prompt/records-a-failed-send`.
   */
  readonly send: (message: MailMessage) => Effect.Effect<void, MailSendError>;
}

export class Mailer extends Context.Service<Mailer, MailerShape>()("@feelsie/checkin/Mailer") {}

/** The production adapter from Alchemy's send client to the handler's narrow mail seam. */
export const mailerLayer = (email: Pick<Cloudflare.Email.SendClient, "send">): Layer.Layer<Mailer> =>
  Layer.succeed(Mailer, {
    send: (message) =>
      email.send(message).pipe(
        EffectApi.asVoid,
        EffectApi.mapError((error) => new MailSendError({ reason: error.message })),
        EffectApi.provide(RuntimeContext.phantom),
      ),
  });

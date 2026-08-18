import { configLayer } from "@feelsie/core";
import { capabilities } from "@feelsie/core/d1";
import { coreDatabase } from "@feelsie/core/stack";
// The check-in Worker: one cron trigger, one send binding, one D1 binding, two routes.
//
// **One Worker holds both the trigger and the send, and that is settled rather than assumed.**
// F1 asked whether `send_email` works inside a `scheduled` handler and held a correction in
// reserve — move the send to a `fetch` route the handler calls. It is not needed:
// `prototypes/cron-send-email-spike/` shows the send executing from a scheduled fire, with the
// binding's address restrictions enforced there exactly as on a request.
//
// `main: import.meta.url` makes this module its own entrypoint, and the bundler reads its
// DEFAULT export as that entrypoint — a Worker exported by name bundles to
// `"default" is not exported`, at deploy time rather than at type-check time.
import { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { CheckinConfig, decodeCheckinConfig, readEnvironment } from "./config.ts";
import { MailSendError } from "./errors.ts";
import { Mailer } from "./mailer.ts";
import { promptSenderAddress } from "./message.ts";
import { router } from "./routes.ts";
import { sendDailyPrompt } from "./schedule.ts";

/**
 * Hourly, with the send hour decided in `schedule.ts`. Cron triggers are UTC and the send hour
 * is local, so an expression that named the hour would be an hour wrong for half the year —
 * see `docs/rationale/the-cron-runs-every-hour.md`.
 */
export const cronExpression = "0 * * * *";

export default Cloudflare.Worker(
  "Worker",
  { main: import.meta.url },
  Effect.gen(function* () {
    // ─── init: once at plan time, once per cold start ───
    const environment = yield* readEnvironment;
    const coreConfig = Layer.orDie(configLayer(environment));
    const checkin = yield* Effect.orDie(decodeCheckinConfig(environment));

    // The same value the scheduled handler will send from, computed the same way. Deriving the
    // binding's allow-list from it is what turns
    // `root/checkin/email/sender-follows-the-configured-domain` into something the platform
    // enforces: a Worker sending from anything else is refused by the binding rather than
    // merely being wrong.
    const sender = yield* promptSenderAddress.pipe(Effect.provide(coreConfig));

    const email = yield* Cloudflare.Email.Send(
      yield* Cloudflare.Email.SendEmail("Email", {
        allowedSenderAddresses: [sender],
        // One address, not a list — `destinationAddress` takes a single value, which closes the
        // fan-out case at the type level. A006 makes this a claim by tying it to the zone's
        // declared routing destination; here it is simply the configured inbox.
        destinationAddress: checkin.inboxAddress,
      }),
    );

    const mailer = Layer.succeed(Mailer, {
      send: (message) =>
        email.send(message).pipe(
          Effect.asVoid,
          // The binding's client fails with `SendEmailError`, whose `message` is where the
          // simulator and the real service put the refusal. It is carried through because
          // `send_failures.reason` is the only record the failure leaves.
          Effect.mapError((error) => new MailSendError({ reason: error.message })),
          // `RuntimeContext` is ambient by the time a handler runs, and this layer is built in
          // init where there is nothing to provide. `phantom` is Alchemy's own idiom for it, and
          // `packages/core/src/d1.ts` already uses it for the same reason.
          Effect.provide(RuntimeContext.phantom),
        ),
    });

    const services = Layer.mergeAll(
      coreConfig,
      Layer.succeed(CheckinConfig, checkin),
      mailer,
      yield* capabilities(yield* coreDatabase),
    );

    yield* Cloudflare.Workers.cron(cronExpression, () => sendDailyPrompt.pipe(Effect.provide(services)));

    return {
      // ─── runtime: once per request ───
      fetch: router.pipe(Effect.provide(services)),
    };
  }).pipe(
    Effect.provide(Cloudflare.D1.QueryDatabaseBinding),
    Effect.provide(Cloudflare.Email.SendBinding),
    Effect.provide(Cloudflare.Workers.CronEventSourceLive),
  ),
);

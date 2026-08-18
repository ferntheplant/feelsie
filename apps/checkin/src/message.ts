// The daily prompt, as an outgoing message.
//
// **No address is written here.** The sender is built from the configured mail domain through
// `core`'s `senderAddress`, and the recipient is a configured value. That is
// `root/checkin/email/sender-follows-the-configured-domain`, and the reason it reads as a claim
// about the mechanism rather than about a value is that this is a public repository: the domain
// is a secret, so no checkout holds the string a witness would compare against.

import { senderAddress } from "@feelsie/core";
import type { Token, CoreConfig } from "@feelsie/core";
import { Effect } from "effect";

import { CheckinConfig } from "./config.ts";
import type { MailMessage } from "./mailer.ts";
import { checkInPath } from "./paths.ts";

/**
 * The local part of the sending address. A local part is not an address — it carries no domain,
 * so it is not the literal the lint rule under `apps/checkin/**` denies, and it cannot be the
 * thing that survives a mail-domain change.
 */
const promptSenderLocalPart = "prompt";

/**
 * The address the daily prompt is sent from. One value, used twice: the message below carries
 * it, and `worker.ts` pins the send binding's `allowedSenderAddresses` to it — so the platform
 * refuses a send from anything else rather than delivering it.
 */
export const promptSenderAddress: Effect.Effect<string, never, CoreConfig> = senderAddress(promptSenderLocalPart);

const promptLink = (origin: string, token: Token): string =>
  `${origin}${checkInPath}?token=${encodeURIComponent(token)}`;

export const promptMessage = (token: Token): Effect.Effect<MailMessage, never, CheckinConfig | CoreConfig> =>
  Effect.gen(function* () {
    const checkin = yield* CheckinConfig;
    const from = yield* promptSenderAddress;

    return {
      from,
      to: checkin.inboxAddress,
      subject: "How was today?",
      // A link, and no reply address. `docs/rationale/the-prompt-carries-a-link.md` has the
      // argument: reply-by-email needs a MIME parser, and every part of one fails silently.
      text: [
        "Three sliders and a minute.",
        "",
        promptLink(checkin.origin, token),
        "",
        "The link works for seven days.",
      ].join("\n"),
    };
  });

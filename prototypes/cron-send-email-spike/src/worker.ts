// One Worker holding a cron trigger AND a `send_email` binding — the exact shape F1
// says the whole check-in Worker rests on. `main: import.meta.url` makes this module its
// own entrypoint, and the bundler reads the module's DEFAULT export as that entrypoint.
//
// Two schedules, on purpose. The first is the shape F1 asks about. The second exists to
// make the answer's caveat observable rather than asserted: it sends to an address the
// binding forbids, does not catch, and the run still reports success.
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { Database } from "./database.ts";

/** On the onboarded sending subdomain, as production requires. Never delivered here. */
const SENDER = "prompt@mail.spike.example";
/** The one address the binding is pinned to. */
const INBOX = "inbox@spike.example";
/** Not the pinned address. The local simulator validates this exactly as Miniflare does. */
const ELSEWHERE = "elsewhere@spike.example";

// Both expressions are fired MANUALLY, through the Miniflare-compatible
// `/cdn-cgi/handler/scheduled` route the local runtime exposes. They are deliberately
// times that will not come round during a test run: the dev runtime also starts a
// Node-side timer per expression, and F1's suggested `*/2 * * * *` would let a real fire
// race the manual one and add rows nobody asked for.
/** The F1 shape: a schedule whose handler sends. */
export const SENDS = "0 3 * * *";
/** The same, aimed at an address the binding refuses. */
export const REFUSED = "0 4 * * *";

/**
 * `send_email` is a Worker-only binding: it declares no cloud-side resource, which is why
 * this spike needs no Email Routing zone, no verified address, and no account. Pinning
 * `destinationAddress` is what gives the second schedule something to be refused by.
 */
const Email = Cloudflare.Email.SendEmail("Email", {
  allowedSenderAddresses: [SENDER],
  destinationAddress: INBOX,
});

export default Cloudflare.Worker(
  "Worker",
  { main: import.meta.url },
  Effect.gen(function* () {
    // ─── init: once per cold start ───
    const database = yield* Database;
    const d1 = yield* Cloudflare.D1.QueryDatabase(database);
    const email = yield* Cloudflare.Email.Send(yield* Email);

    // A cron fire has no response to assert against, so every step writes a row and the
    // `fetch` route below reads them back. The absence of a row is as much of a result as
    // its presence — see the REFUSED schedule.
    const record = (cron: string, stage: string, detail?: string) =>
      d1
        .prepare("INSERT INTO attempts (cron, stage, detail) VALUES (?, ?, ?)")
        .bind(cron, stage, detail ?? null)
        .run();

    yield* Cloudflare.Workers.cron(SENDS, () =>
      Effect.gen(function* () {
        yield* record(SENDS, "attempted");
        const result = yield* email.send({
          from: SENDER,
          to: INBOX,
          subject: "spike",
          text: "sent from a scheduled handler",
        });
        // There is no `sent` row unless `send` returned, so the row is the evidence.
        yield* record(SENDS, "sent", JSON.stringify(result ?? null));
      }),
    );

    yield* Cloudflare.Workers.cron(REFUSED, () =>
      Effect.gen(function* () {
        yield* record(REFUSED, "attempted");
        // Deliberately unhandled. `CronEventSourceLive` wraps every handler in
        // `Effect.catchCause(() => Effect.void)`, so this failure reaches nothing.
        yield* email.send({
          from: SENDER,
          to: ELSEWHERE,
          subject: "spike",
          text: "this destination is not the pinned one",
        });
        yield* record(REFUSED, "sent");
      }),
    );

    return {
      // ─── runtime: once per request ───
      fetch: Effect.gen(function* () {
        const { results } = yield* d1.prepare("SELECT cron, stage, detail FROM attempts ORDER BY seq").all<{
          cron: string;
          stage: string;
          detail: string | null;
        }>();
        // `json` can fail on an unserialisable body, so it is an Effect — unlike `text`.
        return yield* HttpServerResponse.json(results);
      }),
    };
  }).pipe(
    Effect.provide(Cloudflare.D1.QueryDatabaseBinding),
    Effect.provide(Cloudflare.Email.SendBinding),
    Effect.provide(Cloudflare.Workers.CronEventSourceLive),
  ),
);

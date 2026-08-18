// F1 of `.scratch/fog.md`: does `send_email` work inside a `scheduled` handler? The whole
// check-in Worker rests on one Worker holding both a cron trigger and a send binding, and
// if that does not work the shape of A002 changes.
//
// The run below fires each schedule through the Miniflare-compatible manual trigger route
// the local runtime exposes, then reads back what the handler recorded. Three things are
// separable and each has a test:
//
//   1. The arrangement COMPILES. A send requires `RuntimeContext`; `Workers.cron` types
//      its handler as `Exclude<Req, RuntimeContext>`, so the requirement is discharged by
//      the event source. That is a type-level answer and it is checked by `vp check`.
//   2. The send EXECUTES from a scheduled fire, and the binding's address restrictions are
//      enforced there exactly as they are on a request.
//   3. A send that fails inside a scheduled handler is INVISIBLE. This is the finding, and
//      it is the reason the spike has a second schedule.
import { localState } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Vitest";
import { Effect } from "effect";
import { describe, expect } from "vite-plus/test";

import { SpikeStack } from "./alchemy.run.ts";
import { REFUSED, SENDS } from "./src/worker.ts";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: localState(),
  dev: true,
});

type Attempt = { cron: string; stage: string; detail: string | null };

/**
 * Fire one schedule the way `wrangler dev` does. The entry Worker serves
 * `/cdn-cgi/handler/scheduled` and forwards `cron` to the `ScheduledController`, which is
 * what `CronEventSourceLive` matches on — so the expression must be exact or the handler
 * is skipped and the run still reports success.
 */
const fire = (url: string, cron: string) =>
  Effect.promise(async () => {
    const response = await fetch(`${url}/cdn-cgi/handler/scheduled?cron=${encodeURIComponent(cron)}&format=json`);
    return { status: response.status, body: (await response.json()) as { outcome: string } };
  });

const attempts = (url: string) => Effect.promise(async () => (await (await fetch(url)).json()) as Attempt[]);

describe("a Worker holding both a cron trigger and a send_email binding", () => {
  const stack = beforeAll(deploy(SpikeStack));
  afterAll(destroy(SpikeStack));

  test(
    "sends from inside the scheduled handler",
    Effect.gen(function* () {
      const { worker } = yield* stack;
      const url = worker.url;
      expect(url).toBeDefined();

      const fired = yield* fire(url ?? "", SENDS);
      expect(fired.status).toBe(200);
      expect(fired.body.outcome).toBe("ok");

      const rows = (yield* attempts(url ?? "")).filter((row) => row.cron === SENDS);
      // `attempted` alone would mean the handler ran and the send did not return. The
      // `sent` row is written after `email.send` resolves, so it is the only thing here
      // that distinguishes "the binding works in this handler" from "the handler ran".
      expect(rows.map((row) => row.stage)).toEqual(["attempted", "sent"]);
    }),
  );

  test(
    "enforces the binding's pinned destination from a scheduled fire too",
    Effect.gen(function* () {
      const { worker } = yield* stack;
      const url = worker.url ?? "";

      yield* fire(url, REFUSED);

      const rows = (yield* attempts(url)).filter((row) => row.cron === REFUSED);
      // The handler recorded `attempted`, then sent to an address outside the binding's
      // `destinationAddress`. No `sent` row means the send threw rather than returned —
      // the local simulator validates the allow-list exactly as Miniflare does, and it
      // does so on the scheduled path as much as on the request path.
      expect(rows.map((row) => row.stage)).toEqual(["attempted"]);
    }),
  );

  test(
    "reports that refused fire as a success, which is the finding",
    Effect.gen(function* () {
      const { worker } = yield* stack;
      const url = worker.url ?? "";

      const fired = yield* fire(url, REFUSED);

      // The send failed — the test above proves no `sent` row was written — and the
      // invocation is still `ok`. `CronEventSourceLive` wraps every handler in
      // `Effect.catchCause(() => Effect.void)`, so Cloudflare never observes a failure,
      // its retry never engages, and `controller.noRetry()` is moot.
      //
      // For A002 this is the whole risk: the daily mail can stop going out and every
      // signal a platform offers will read normal. A claim about sending needs a witness
      // that observes the send, not one that observes the invocation.
      expect(fired.status).toBe(200);
      expect(fired.body.outcome).toBe("ok");
    }),
  );
});

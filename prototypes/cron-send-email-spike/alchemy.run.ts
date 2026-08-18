// The smallest stack that can hold F1's question: one D1 database to record what
// happened, and one Worker carrying both a cron trigger and a `send_email` binding.
// Nothing else, so that a failure names the arrangement rather than the complexity.
import { ALCHEMY_DEV, localState, Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { Database } from "./src/database.ts";
import Worker from "./src/worker.ts";

// `localState()` under `ALCHEMY_DEV`, `Cloudflare.state()` otherwise. The branch is not
// optional: a stack's own `state:` wins over anything `Test.make` passes, so declaring
// the shared store unconditionally fails every test with `AuthError` before one runs.
const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export const SpikeStack = Stack(
  "cron-send-email-spike",
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const database = yield* Database;
    const worker = yield* Worker;
    return { database, worker };
  }),
);

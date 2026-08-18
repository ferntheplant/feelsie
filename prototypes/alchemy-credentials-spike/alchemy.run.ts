// The trivial stack §7 asks for: one D1 database with a migrations directory, one
// Worker that reads it through the D1 binding. Nothing else, so that a failure
// names credentials rather than complexity.
import { ALCHEMY_DEV, localState, Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { Database } from "./src/database.ts";
import Worker from "./src/worker.ts";

// The same conditional `packages/core/alchemy.run.ts` uses, deliberately, because it is
// the half of the arrangement that is easiest to get wrong and hardest to notice. A stack
// declaring `Cloudflare.state()` unconditionally type-checks, passes review, and fails
// every test in the repository with `AuthError` — the stack's own `state:` wins over
// whatever `Test.make` passes, since `evalStack` provides `stack.services`. This spike
// passing offline is what says the branch is on the right side.
const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export const SpikeStack = Stack(
  "alchemy-credentials-spike",
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const database = yield* Database;
    const worker = yield* Worker;
    return { database, worker };
  }),
);

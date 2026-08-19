// The Check-in Stack: the Worker, and nothing else.
//
// It declares no database. The D1 database belongs to the Core Stack, and the whole reason the
// two are separate is that `alchemy destroy` on this one must not take the history with it —
// `.scratch/ALCHEMY-MIGRATION.md` §2 calls that not negotiable. `src/worker.ts` reaches across
// with `coreDatabase`, the `Resource.ref` in `packages/core/src/Stack.ts`, which resolves at
// plan time against the current stage; so the Core Stack must already be deployed to the stage
// this one is deploying to.
//
// It is the plain three-argument `Stack(...)` form rather than a typed handle because nothing
// reads its outputs. Only a stack that is read from needs one.
import { ALCHEMY_DEV, localState, Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import Worker from "./src/worker.ts";

// `localState()` under `ALCHEMY_DEV`, `Cloudflare.state()` otherwise. The branch is not
// optional: a stack's own `state:` wins over anything `Test.make` passes, so declaring the
// shared store unconditionally fails every test with `AuthError` before one runs. State has to
// outlive the machine that made it, which is why the shared store is the other half.
const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export default Stack(
  "feelsie-checkin",
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const worker = yield* Worker;
    return { worker };
  }),
);

// The consuming stack, standing in for `apps/checkin`. It declares a Worker and no
// database: the database belongs to the stack in `data.run.ts`, and destroying this one
// must not touch it — which is the reason the real project splits its stacks at all.
//
// It is the plain three-argument form rather than a handle, because nothing reads ITS
// outputs. Only the stack being read from needs a typed handle.
import { ALCHEMY_DEV, localState, Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import Worker from "./src/worker.ts";

const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export default Stack(
  "cross-stack-d1-spike-app",
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const worker = yield* Worker;
    return { worker };
  }),
);

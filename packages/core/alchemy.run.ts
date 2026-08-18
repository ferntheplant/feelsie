// The Core Stack: the D1 database and its migrations, and nothing else.
//
// It is its own stack rather than a slice of one shared stack for a single reason, and
// the reason is not cadence: destroying the dashboard must not destroy the database.
// `apps/*` read this stack; they never declare it.
//
// This module is plan-time only — no Worker ever bundles it — which is why it may resolve
// `migrationsDir` from `import.meta.url`. A module that IS bundled may not: `new URL(...,
// import.meta.url)` is evaluated at cold start inside workerd, where it dies with
// `Invalid URL string`. Resolving it here also makes the path independent of the working
// directory the deploy was launched from.
import { fileURLToPath } from "node:url";

import { ALCHEMY_DEV, localState } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { CoreStack } from "./src/Stack.ts";

// State says which resources already exist, so it has to outlive the machine that made
// them. A solo developer on two laptops plus a CI runner is three empty `.alchemy/`
// directories, and an empty state store does not mean "nothing exists" — it means
// "create everything", which is how you end up with a second D1 database and a first one
// nothing can reach.
//
// `Cloudflare.state()` is the shared store: a Durable Object in the account, bootstrapped
// on first use, with its auth token in the account's Secrets Store. Every machine reads
// the same rows.
//
// It cannot be the only store, and this is not a preference. The stack's own `state:`
// wins over anything the test harness passes — `evalStack` provides `stack.services`,
// which already carries this layer — so declaring `Cloudflare.state()` unconditionally
// makes every test in the repository fail with `AuthError` before it runs. `ALCHEMY_DEV`
// is the discriminator: `vp test` sets it through `vite.config.ts`, `alchemy dev` sets it
// itself, and `alchemy deploy` leaves it unset.
//
// `Layer.orDie` because a stack's `state` is typed `Layer<State, never, …>` and reading
// `ALCHEMY_DEV` carries a `ConfigError` for an unparseable value. There is no recovering
// from "we could not work out where state lives" — continuing would pick a store by
// accident, and picking wrong creates duplicate infrastructure.
const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export default CoreStack.make(
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1.Database("Database", {
      // Files sort by numeric prefix and apply in order, with the applied set skipped.
      // `0001-core.sql` is already named for it and already in the package's `files`
      // array, so this reuses the migration the tests run rather than duplicating it.
      migrationsDir: fileURLToPath(new URL("./migrations", import.meta.url)),
    });

    return { database };
  }),
);

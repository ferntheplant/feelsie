// The Core Stack: the D1 database and its migrations, and nothing else.
//
// It is its own stack rather than a slice of one shared stack for a single reason, and
// the reason is not cadence: destroying the dashboard must not destroy the database.
// `apps/*` read this stack; they never declare it.
import { ALCHEMY_DEV, localState } from "alchemy";
import type { InputProps } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { CoreStack } from "./src/Stack.ts";
import type { CoreStackShape } from "./src/Stack.ts";

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
      // Relative, as Alchemy's D1 page writes it, and resolved against the working
      // directory of whoever runs the deploy — which is why the house rule spells that
      // directory out (`vp exec -F @feelsie/core`) rather than leaving it to the shell.
      // An absolute path computed from `import.meta.url` would survive a deploy launched
      // from anywhere, and it is still the wrong choice: `migrationsDir` is a persisted
      // property of the resource, so the path is written into the shared state store and
      // compared against on the next plan. A checkout at a different path — CI, a second
      // laptop — then differs in props and plans a pointless update. The path has to mean
      // the same thing on every machine, and only a relative one does.
      //
      // Files sort by numeric prefix and apply in order, with the applied set skipped.
      // The `0001_core.sql` spelling is Alchemy's: `listSqlFiles` takes the prefix as
      // `name.split("_")[0]`, so an underscore is what the sort actually reads.
      migrationsDir: "./migrations",
    });

    // Scalars, because a stack output cannot be a resource — an app binds the database
    // through the `coreDatabase` ref in `src/Stack.ts`, not through this. See that file.
    //
    // `satisfies` is what ties this stack to the handle. `Stack.make` infers its output
    // type and never checks it against the handle's `Shape`, so without this a renamed or
    // misspelled key type-checks here and fails at plan time in whichever app reads it.
    // `InputProps` rather than the shape itself: a shape declares the RESOLVED types a
    // consumer sees, and what is returned here are the unresolved plan-time Outputs.
    return {
      databaseId: database.databaseId,
      databaseName: database.databaseName,
    } satisfies InputProps<CoreStackShape>;
  }),
);

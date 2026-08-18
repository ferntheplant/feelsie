// The owning stack: one D1 database and nothing else, standing in for the Core Stack.
import { ALCHEMY_DEV, localState } from "alchemy";
import type { InputProps } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";

import { DataStack } from "./src/DataStack.ts";
import type { DataStackShape } from "./src/DataStack.ts";

const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));

export default DataStack.make(
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1.Database("Database", {
      migrationsDir: "./migrations",
    });

    return {
      databaseId: database.databaseId,
      databaseName: database.databaseName,
    } satisfies InputProps<DataStackShape>;
  }),
);

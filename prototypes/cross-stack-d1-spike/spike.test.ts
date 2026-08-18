// Can a Worker in one stack bind a D1 database declared by another?
//
// `packages/core/src/Stack.ts` says it can — it calls itself "the typed handle `checkin`
// and `dashboard` import" — and the migration document treats `const core = yield* CoreStack`
// as settled. Nothing had ever compiled that sentence, let alone run it, and two things
// suggested it might not hold:
//
//   1. Alchemy's multi-stack walkthrough only ever puts SCALARS in a stack's shape
//      (`{ url: string }`, filled by `api.url.as<string>()`). A Worker cannot bind a URL.
//   2. A cross-stack read yields `Output.ToOutput` of the shape, so a resource-typed field
//      arrives as an `ObjectExpr` proxy rather than as the resource. That is a type error
//      against any signature asking for the resource itself.
//
// Deploying both stacks and serving one request is the only thing that answers it.
import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Vitest";
import { Effect } from "effect";
import { describe, expect } from "vite-plus/test";

import AppStack from "./alchemy.run.ts";
import DataStack from "./data.run.ts";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  dev: true,
});

describe("a Worker binding a database another stack owns", () => {
  // Order matters and is not incidental: a cross-stack read resolves against the upstream
  // stack's PERSISTED outputs, so the upstream must already be deployed. Deploying the app
  // first is not a race, it is a plan-time failure.
  const data = beforeAll(deploy(DataStack));
  const app = beforeAll(deploy(AppStack));

  // Torn down in the opposite order, for the same reason the stacks are split: the app goes
  // first, and the database survives it right up until this file is done with it.
  afterAll(destroy(AppStack));
  afterAll(destroy(DataStack));

  test(
    "publishes scalars from one stack and reads them in the test",
    Effect.gen(function* () {
      // The half of the shape model that DOES work: a scalar crosses the boundary intact.
      // `dev:`-prefixed is the proof no cloud call was made.
      const { databaseId, databaseName } = yield* data;
      expect(databaseId).toMatch(/^dev:/);
      expect(databaseName).toBeTypeOf("string");
      const { worker } = yield* app;
      expect(worker.url).toBeDefined();
    }),
  );

  test(
    "serves a request that writes and reads the other stack's database",
    Effect.gen(function* () {
      const { worker } = yield* app;
      // The assertion is not "the deploy succeeded" — a plan can bind a resource that the
      // cold-start evaluation then fails to resolve, and the failure surfaces as a 500 from
      // a Worker that deployed perfectly. Only a served request covers both phases.
      const response = yield* Effect.promise(() => fetch(worker.url ?? ""));
      expect(response.status).toBe(200);
      expect(yield* Effect.promise(() => response.text())).toBe("b");
    }),
  );
});

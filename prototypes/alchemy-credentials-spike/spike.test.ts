// §7 of `.scratch/ALCHEMY-MIGRATION.md`: does an Alchemy test run need Cloudflare
// credentials? `/testing` says tests run against real clouds and every sample there
// passes `state: Cloudflare.state()`; tutorial part 4 says `dev` flips every Worker to
// workerd inside the test process. Both cannot govern this file.
//
// The answer is neither page. It has two halves, and each has a test below.
//
//   1. The run never CONTACTS Cloudflare. D1 is emulated, the Worker runs in workerd,
//      every resource id is `dev:`-prefixed, and the filesystem state store is enough.
//   2. It still RESOLVES credentials, eagerly, before it can know that. Strip them and
//      `Cloudflare.providers()` fails at layer construction — the file never runs.
//
// The `test.env` block in the root `vite.config.ts` closes the gap by supplying
// placeholders to every test in the repository. See `AGENTS.md` for why that is sound
// rather than a workaround.
import { localState } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Vitest";
import { Effect } from "effect";
import { describe, expect } from "vite-plus/test";

import { SpikeStack } from "./alchemy.run.ts";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  // The filesystem store, not `Cloudflare.state()`. The state-store page calls this the
  // default and says it "works for solo development"; the spike asked whether it also
  // works with no usable account, and it does — `.alchemy/state/` is a directory of
  // JSON, provisioned by nothing.
  state: localState(),
  dev: true,
});

describe("an Alchemy test run with no usable Cloudflare account", () => {
  const stack = beforeAll(deploy(SpikeStack));
  afterAll(destroy(SpikeStack));

  test(
    "holds only placeholder credentials",
    Effect.sync(() => {
      // If this fails, everything below it is meaningless: it would be proving that a
      // machine WITH an account can deploy, which was never in doubt. All four come from
      // the `test.env` block in the root `vite.config.ts`, which assigns them to
      // `process.env` before any test runs — overriding whatever the developer's shell
      // and `~/.alchemy/` would otherwise have supplied.
      expect(process.env.CLOUDFLARE_ACCOUNT_ID).toBe("0".repeat(32));
      expect(process.env.CLOUDFLARE_API_TOKEN).toBe("placeholder-not-a-real-token");
      // `CI=1` is what forces Alchemy down its environment-variable path instead of
      // reading `~/.alchemy/`, so a developer who has run `alchemy login` gets the same
      // run as a clean checkout rather than a quietly different one.
      expect(process.env.CI).toBe("1");
      expect(process.env.ALCHEMY_DEV).toBe("1");
    }),
  );

  test(
    "deploys the D1 database locally, and says so in the id",
    Effect.gen(function* () {
      const { database } = yield* stack;
      // `dev:`-prefixed ids are what `/environments/local-development` offers as proof
      // that no cloud call was made. Asserting on it is the difference between "the
      // deploy succeeded" and "the deploy succeeded without leaving the machine" —
      // which is the whole question, given the credentials above could not authenticate
      // anything.
      expect(database.databaseId).toMatch(/^dev:/);
    }),
  );

  test(
    "serves a request that writes and reads the emulated database",
    Effect.gen(function* () {
      const { worker } = yield* stack;
      // In dev mode this is the local workerd URL. A Worker deployed with no route has
      // none at all, hence the optional type — an absent one here would mean the local
      // runtime never came up, which is a different failure from a bad response.
      const url = worker.url;
      expect(url).toBeDefined();

      // Plain `fetch`, not Alchemy's `getWhenReady`. That helper exists to ride out the
      // window where a freshly-deployed Worker's route has not propagated to the edge,
      // and there is no edge here — retrying a local workerd would only turn a real
      // failure into a slow one.
      const response = yield* Effect.promise(() => fetch(url ?? ""));
      expect(response.status).toBe(200);
      expect(yield* Effect.promise(() => response.text())).toBe("b");
    }),
  );
});

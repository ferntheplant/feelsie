import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

const migration = (name: string): string => readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8");

it.effect("adds attempt identities when existing failure timestamps collide", () =>
  Effect.acquireUseRelease(
    Effect.sync(() => new DatabaseSync(":memory:")),
    (database) =>
      Effect.sync(() => {
        database.exec(migration("0001_core.sql"));
        database.exec(migration("0002_prompt_send_lifecycle.sql"));
        database
          .prepare("INSERT INTO send_failures (date, failed_at, reason) VALUES (?, ?, ?)")
          .run("2024-06-11", 1_718_068_800_000, "first");
        database
          .prepare("INSERT INTO send_failures (date, failed_at, reason) VALUES (?, ?, ?)")
          .run("2024-06-11", 1_718_068_800_000, "second");

        database.exec(migration("0003_send_failure_idempotency.sql"));

        assert.deepEqual(database.prepare("SELECT attempt_id, reason FROM send_failures ORDER BY seq").all(), [
          { attempt_id: "legacy-1", reason: "first" },
          { attempt_id: "legacy-2", reason: "second" },
        ]);
      }),
    (database) => Effect.sync(() => database.close()),
  ),
);

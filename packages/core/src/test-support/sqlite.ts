import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { Effect, Option } from "effect";

import { capabilitiesLayer, DatabaseError } from "#core";
import { Database } from "#core/database";
import type { DatabaseShape, SqlRow, SqlStatement } from "#core/database";

const migrationsDirectory = new URL("../../migrations/", import.meta.url);

// Every migration, in the order Alchemy's `listSqlFiles` applies them: sorted on the numeric
// prefix that `name.split("_")[0]` reads. Reading the directory rather than naming one file is
// what keeps this harness and D1 on the same schema — the first version named `0001_core.sql`
// and would have silently skipped `0002_prompt_send_lifecycle.sql`.
const migrations = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10))
  .map((name) => readFileSync(new URL(name, migrationsDirectory), "utf8"));

const runStatement = (database: DatabaseSync, statement: SqlStatement): void => {
  database.prepare(statement.text).run(...statement.parameters);
};

export interface TestDatabase {
  readonly raw: DatabaseSync;
  readonly service: DatabaseShape;
}

// Not exported: `withTestDatabase` is the only way in, because it is the one that closes
// the handle. An exported constructor is an invitation to open a database a test never
// releases, and `node:sqlite` will not tell you that you did.
const makeTestDatabase = (): TestDatabase => {
  const raw = new DatabaseSync(":memory:");
  for (const migration of migrations) {
    raw.exec(migration);
  }

  return {
    raw,
    service: {
      first: (statement) =>
        Effect.try({
          try: () => {
            const row = raw.prepare(statement.text).get(...statement.parameters);
            return row === undefined ? Option.none<SqlRow>() : Option.some(row as SqlRow);
          },
          catch: (cause) => new DatabaseError({ cause, operation: "query first row" }),
        }),
      batch: (statements) =>
        Effect.try({
          try: () => {
            raw.exec("BEGIN");
            try {
              for (const statement of statements) {
                runStatement(raw, statement);
              }
              raw.exec("COMMIT");
            } catch (cause) {
              raw.exec("ROLLBACK");
              throw cause;
            }
          },
          catch: (cause) => new DatabaseError({ cause, operation: "execute batch" }),
        }),
    },
  };
};

export const withTestDatabase = <A, E, R>(
  use: (database: TestDatabase) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E, Exclude<R, Database>> =>
  Effect.acquireUseRelease(
    Effect.sync(makeTestDatabase),
    (database) => use(database).pipe(Effect.provideService(Database, database.service)),
    (database) => Effect.sync(() => database.raw.close()),
  );

/**
 * The same handle, exposed as the capability services an app actually holds. A test that
 * exercises a production handler takes this: providing `Database` directly would let the test
 * reach operations the handler cannot, which is the difference the seam exists to make.
 */
export const withTestCapabilities = <A, E, R>(use: (database: TestDatabase) => Effect.Effect<A, E, R>) =>
  withTestDatabase((database) => use(database).pipe(Effect.provide(capabilitiesLayer)));

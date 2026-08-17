import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { Effect, Option } from "effect";

import { Database, DatabaseError } from "#core";
import type { DatabaseShape, SqlRow, SqlStatement } from "#core";

const migration = readFileSync(new URL("../../migrations/0001-core.sql", import.meta.url), "utf8");

const runStatement = (database: DatabaseSync, statement: SqlStatement): void => {
  database.prepare(statement.text).run(...statement.parameters);
};

export interface TestDatabase {
  readonly raw: DatabaseSync;
  readonly service: DatabaseShape;
}

export const makeTestDatabase = (): TestDatabase => {
  const raw = new DatabaseSync(":memory:");
  raw.exec(migration);

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

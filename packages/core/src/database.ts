import type { Effect, Option } from "effect";
import { Context } from "effect";

import type { DatabaseError } from "./errors.ts";

export type SqlParameter = string | number | null;
export type SqlRow = Readonly<Record<string, unknown>>;

export interface SqlStatement {
  readonly text: string;
  readonly parameters: ReadonlyArray<SqlParameter>;
}

export interface DatabaseShape {
  readonly first: (statement: SqlStatement) => Effect.Effect<Option.Option<SqlRow>, DatabaseError>;
  readonly batch: (statements: ReadonlyArray<SqlStatement>) => Effect.Effect<void, DatabaseError>;
}

export class Database extends Context.Service<Database, DatabaseShape>()("@feelsie/core/Database") {}

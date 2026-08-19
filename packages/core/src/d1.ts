// The capability services, satisfied by the D1 binding rather than by `node:sqlite`.
//
// `Database` is a capability tag with two implementations that never meet: the
// `node:sqlite` one in `test-support/sqlite.ts` that every existing test runs against,
// and this one, which only exists inside a Worker. Pure logic in `core.ts` requires the
// tag and cannot tell them apart, which is the property the whole seam is for. Neither
// implementation leaves the package: what an app receives is the narrow services of
// `capabilities.ts`, built over one of the two.
//
// Two things are not obvious, and both are load-bearing:
//
//   1. **The D1 client cannot fail — it can only die.** Every executor returns
//      `Effect<A, never, RuntimeContext>`, so a SQL error arrives as a defect rather
//      than a typed failure. `DatabaseShape` promises `DatabaseError`, so this module
//      converts one to the other. Nothing upstream would notice the difference until a
//      malformed statement killed a fiber instead of returning a handled error.
//   2. **`RuntimeContext` is discharged with `RuntimeContext.phantom`.** The D1 client's
//      effects require it; `DatabaseShape`'s methods have no requirement. The layer is
//      built during a Worker's init phase, so the context is genuinely ambient by the
//      time a handler runs and there is nothing to provide. `phantom` is Alchemy's own
//      idiom for exactly this — see `Cloudflare/StateStore/Api.ts` in the package.
import { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Cause, Effect, Layer, Option, Schedule } from "effect";

import { checkInCapabilitiesLayer } from "./capabilities.ts";
import type { CheckIn, CheckInFormRead, PromptWrite } from "./capabilities.ts";
import { Database } from "./database.ts";
import type { DatabaseShape, SqlRow, SqlStatement } from "./database.ts";
import { DatabaseError } from "./errors.ts";

const transientD1Messages = [
  "Network connection lost",
  "storage caused object to be reset",
  "reset because its code was updated",
];

const isTransientD1Failure = (cause: Cause.Cause<never>): boolean => {
  const rendered = Cause.pretty(cause);
  return transientD1Messages.some((message) => rendered.includes(message));
};

/**
 * Run a D1 effect, discharging `RuntimeContext` and turning any defect into the
 * `DatabaseError` the `Database` service promises. Interruption is re-raised untouched —
 * a cancelled request is not a database failure, and swallowing it here would make a
 * timeout look like bad SQL.
 */
const attempt = <A>(
  effect: Effect.Effect<A, never, RuntimeContext>,
  operation: string,
): Effect.Effect<A, DatabaseError> =>
  effect.pipe(
    Effect.provide(RuntimeContext.phantom),
    Effect.catchCause((cause) =>
      Cause.hasInterrupts(cause)
        ? Effect.failCause(cause)
        : Effect.fail(new DatabaseError({ cause, operation, retryable: isTransientD1Failure(cause) })),
    ),
    // D1 documents transient failures for reads and writes. Every statement behind this adapter
    // is idempotent, so retrying here preserves one domain decision in the caller.
    Effect.retry({
      while: (error) => error.retryable === true,
      times: 2,
      schedule: Schedule.exponential("50 millis"),
    }),
  );

const prepare = (
  client: Cloudflare.D1.QueryDatabaseClient,
  statement: SqlStatement,
): Cloudflare.D1.PreparedStatement => {
  const prepared = client.prepare(statement.text);
  return statement.parameters.length > 0 ? prepared.bind(...statement.parameters) : prepared;
};

const shapeOf = (client: Cloudflare.D1.QueryDatabaseClient): DatabaseShape => ({
  first: (statement) =>
    attempt(prepare(client, statement).first<SqlRow>(), "query first row").pipe(
      Effect.map((row) => Option.fromNullOr(row)),
    ),
  batch: (statements) =>
    // D1's `batch` runs its statements sequentially in one call and rolls the whole set
    // back on failure, which is the transaction `DatabaseShape.batch` promises. The
    // `node:sqlite` implementation spells the same guarantee out by hand with
    // BEGIN/COMMIT/ROLLBACK.
    attempt(client.batch(statements.map((statement) => prepare(client, statement))), "execute batch").pipe(
      Effect.asVoid,
    ),
});

/**
 * The capability services, backed by a D1 binding. Yielded during a Worker's init phase, where
 * the resource comes from `yield* coreDatabase` — the `Resource.ref` in `Stack.ts`, NOT from a
 * field on `yield* CoreStack`. A stack output cannot be a resource; the run that settles that is
 * `prototypes/cross-stack-d1-spike/`.
 *
 * **It hands back a Layer of capabilities rather than of `Database`, and that is the point.**
 * An app that could name `Database` could reach arbitrary SQL, which is exactly what the seam in
 * `capabilities.ts` exists to prevent — so the raw service is created and consumed inside this
 * function and never crosses the package boundary.
 *
 * It must be yielded in **init**: `QueryDatabaseBinding` registers the binding on the host
 * Worker at plan time, so a client built lazily on the first request would deploy a Worker with
 * no D1 binding at all.
 */
export const checkInCapabilities = (
  database: Cloudflare.D1.Database,
): Effect.Effect<Layer.Layer<CheckIn | CheckInFormRead | PromptWrite>, never, Cloudflare.D1.QueryDatabase> =>
  Effect.map(Cloudflare.D1.QueryDatabase(database), (client) =>
    Layer.provide(checkInCapabilitiesLayer, Layer.succeed(Database, shapeOf(client))),
  );

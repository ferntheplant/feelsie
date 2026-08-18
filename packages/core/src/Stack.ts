// What `checkin` and `dashboard` import to reach the Core Stack. There are two ways in,
// they are not interchangeable, and which one to use is decided by what is being read.
//
// **A resource is reached with `coreDatabase`, never through a stack output.** This is
// the correction `prototypes/cross-stack-d1-spike/` bought. Putting the D1 resource in a
// stack's shape type-checks; `yield* CoreStack` then hands back `Output.ToOutput` of that
// shape, so `core.database` is an `ObjectExpr` — a plan-time proxy — and binding it dies
// at plan time with `Cannot coerce Output<stackRef(…).database> to a string`, inside
// `QueryDatabaseBinding`'s `host.bind` template. `Resource.ref` is the mechanism that
// works: it names the stack and the logical id and resolves to the resource's own shape,
// so `Cloudflare.D1.QueryDatabase` accepts it exactly as it accepts a local declaration.
//
// **Scalars are reached with `yield* CoreStack`.** That is what Alchemy's own multi-stack
// walkthrough puts in a shape, and it is all a shape can carry.
//
// Both resolve at plan time against the current stage, so a `pr-42` Worker binds the
// `pr-42` database. Neither runs Node-only code at import time: this module is bundled
// into every Worker that touches the database.
import { Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";

/**
 * The stack's name, in one place. It is a plan-time key rather than a label — the
 * `Resource.ref` below looks the stack up by this string, so a rename here is a rename of
 * the lookup in every app.
 */
const CORE_STACK = "feelsie-core";

/**
 * The Core Stack's D1 database, as a Worker in another stack binds it:
 *
 * ```ts
 * const database = yield* coreDatabase;          // init
 * return { fetch: handler.pipe(Effect.provide(d1Layer(database))) };
 * ```
 *
 * The logical id is `"Database"` because that is what `alchemy.run.ts` declares it as. A
 * ref is resolved against the deployed state of the named stack, so the Core Stack must
 * already be deployed to the current stage before an app's plan can succeed.
 */
export const coreDatabase = Cloudflare.D1.Database.ref("Database", { stack: CORE_STACK });

/**
 * What the Core Stack publishes for other stacks to read. Scalars only — see above.
 *
 * Nothing needs these to bind the database; they exist because a stack that publishes
 * nothing cannot be read at all, and an operator or a backup job asking "which database
 * is this stage using?" should not have to open the Cloudflare dashboard to find out.
 */
export interface CoreStackShape {
  readonly databaseId: string;
  readonly databaseName: string;
}

export class CoreStack extends Stack<CoreStack, CoreStackShape>()(CORE_STACK) {}

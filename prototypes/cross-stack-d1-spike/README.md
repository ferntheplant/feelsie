# Can a Worker in one stack bind a D1 database declared by another?

The question `packages/core/src/Stack.ts` was written as though already answered.

## Why it was asked

The Core Stack exists so that destroying the dashboard cannot destroy the database —
[`.scratch/ALCHEMY-MIGRATION.md`](../../.scratch/ALCHEMY-MIGRATION.md) §2 calls that "not
negotiable" — and it pays for that separation with a boundary the Workers have to reach
across. §2 records the crossing as settled: _cross-stack reads are `const core = yield* CoreStack`,
resolved at plan time against the current stage._

Nothing had compiled that sentence. Two things suggested it would not hold:

1. Alchemy's multi-stack walkthrough only ever puts **scalars** in a stack's shape —
   `{ url: string }`, filled by `api.url.as<string>()`. A Worker cannot bind a URL.
2. `yield* SomeStack` returns `Output.ToOutput` of the shape, so a resource-typed field
   arrives as an `ObjectExpr` proxy rather than as the resource.

## The answer, in two halves

**A resource cannot cross a stack boundary as an output.** The first version of this spike
put the D1 resource in the shape, exactly as `packages/core` had it. It type-checks, it
deploys the owning stack, and then the consuming stack's plan dies:

```
Error: Cannot coerce Output<stackRef(cross-stack-d1-spike-data).database> to a string via
JS coercion. Use Output.interpolate`...` or Output.map(output, fn) to compose Outputs —
the value isn't known until deploy time.
  ❯ stringifyBindArg  alchemy/src/Resource.ts:364
  ❯ alchemy/src/Cloudflare/D1/QueryDatabaseBinding.ts:20
```

`QueryDatabaseBinding` registers the binding with ``host.bind`${database}` ``, and that
template coerces its argument to a string. A locally-declared resource has a `LogicalId`
string to give it; a cross-stack proxy has an unresolved `Output` and refuses.

**`Resource.ref` is the mechanism that works.** Every Alchemy resource class carries one:

```ts
export const spikeDatabase = Cloudflare.D1.Database.ref("Database", { stack: DATA_STACK });
```

It names the stack and the logical id, defaults to the current stage, and resolves to the
resource's own shape — so `Cloudflare.D1.QueryDatabase` accepts it exactly as it accepts a
local declaration. `spike.test.ts` deploys both stacks and serves a request through the
Worker that writes and reads the other stack's database, in about four seconds.

**So a stack has two exits and they are for different things.** Scalars leave through the
shape (`yield* DataStack` gives `databaseId` as a plain string, `dev:`-prefixed here, which
is the proof no cloud call was made). Resources leave through a ref. Reaching for the wrong
one is not a style question: it type-checks and fails at plan time in the consuming stack,
which is the last place anyone looks.

## What it changed

- `packages/core/src/Stack.ts` gained `coreDatabase`, the ref, and its `CoreStackShape`
  went from `{ database: Cloudflare.D1.Database }` to the two scalars that can actually
  cross.
- `packages/core/alchemy.run.ts` returns those scalars, checked with
  `satisfies InputProps<CoreStackShape>`. The `satisfies` is not decoration: `Stack.make`
  infers its own output type and never compares it to the handle's `Shape`, so without it a
  misspelled key is caught by nothing.
- `packages/core/src/d1.ts` keeps its narrow `Cloudflare.D1.Database` parameter, which is
  right after all — a ref resolves to exactly that type.

## Running it

```
vp run --filter @feelsie/cross-stack-d1-spike spike
```

Both stacks deploy locally with `dev: true`; nothing contacts Cloudflare. To reproduce the
failure, put `database` back in `DataStackShape`, return the resource from `data.run.ts`,
and have the Worker bind `(yield* DataStack).database`.

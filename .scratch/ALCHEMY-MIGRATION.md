# Adopting Alchemy

**Status**: proposed · **Changes no claims by itself** · **Gated by**: the spike in §7

Alchemy becomes the house IaC: every Cloudflare resource this project uses is declared in
TypeScript, as an Effect, inside the repository. `wrangler.jsonc` never gets written.

This is a build change, not an amendment — it adds no claims. What it does is raise the ceiling
for claims that come after it, the same way `build: integrate Effect tsgo with Vite+ lint (#2)`
did. The amendment that spends the new ceiling is **A006**, sketched in §6.

## 1. Why this is a small lift

Nothing impure has been built yet. `packages/core` is pure Effect over a `Database` service, its
thirteen tests run against `node:sqlite`, and `apps/` does not exist. The migration is additive
almost everywhere.

Two facts make it fit rather than merely work:

- **`Binding.Service` is an open interface.** Alchemy's own R2 client ships two interchangeable
  layers — `BucketBinding` (native) and `BucketHttp` (scoped token) — behind one capability tag.
  `core`'s `Database` is already that pattern, hand-rolled. It gains a third implementation and
  loses nothing.
- **`migrationsDir` points at a folder of numbered `.sql` files**, applied in order on every
  deploy with the applied set skipped. `packages/core/migrations/0001-core.sql` already has that
  name and is already in the package's `files` array.

## 2. Target shape

Three stacks, matching the three projects the catalog already names. The stack boundary and the
slug prefix become the same boundary, which is worth more than it sounds: a witness scoped to one
stack is scoped to one project's claims.

```
packages/core/
  alchemy.run.ts          # Core Stack — the D1 database and its migrations
  src/Stack.ts            # the typed handle checkin and dashboard import
  src/database.ts         # Cloudflare.D1.Database("Database", { migrationsDir })
  src/d1.ts               # Layer<Database> over Cloudflare.D1.QueryDatabase   ← new
  src/*.ts                # unchanged: pure logic over the Database service
  migrations/0001-core.sql  # unchanged
apps/checkin/
  alchemy.run.ts          # yield* CoreStack — Worker, cron, email send + routing
  src/worker.ts
apps/dashboard/
  alchemy.run.ts          # yield* CoreStack — SvelteKit site, Access application
  src/...
```

Alchemy's monorepo guidance says start with one stack and split when packages deploy on different
cadences or when you need to destroy one without the other. **The second reason applies here and
is not negotiable**: destroying the dashboard must not destroy the database. Cross-stack reads are
`const core = yield* CoreStack`, resolved at plan time against the current stage.

## 3. What changes in `core`

Almost nothing, and that is the point.

**`Database` stays.** `DatabaseShape` keeps `first` and `batch`, every operation keeps requiring
it, and `makeTestDatabase` keeps backing it with `node:sqlite`. The thirteen existing tests do not
change and do not acquire a credential requirement.

**One new file**, `src/d1.ts`, provides the same service from Alchemy:

```ts
// Layer<Database> satisfied by the D1 binding rather than by node:sqlite.
Effect.gen(function* () {
  const d1 = yield* Cloudflare.D1.QueryDatabase(Database);
  // adapt prepare/bind/all/first/run → DatabaseShape.first/batch
}).pipe(Effect.provide(Cloudflare.D1.QueryDatabaseBinding));
```

**`Cloudflare.D1.QueryDatabase` is not read-only** — `prepare`, `bind`, `all`, `first`, `run`,
`exec`, where `run` is documented as "executes a mutation (INSERT/UPDATE/DELETE)". R2 got the
least-privilege split (`ReadBucket` / `WriteBucket` / `ReadWriteBucket`); D1 did not.

So the seam A002 and A003 already specify survives intact and is still ours to build: SQL stays
inside `core`, Workers receive narrow capability services, and import lint rules keep them from
reaching past those services to the raw one. **Nothing in the rewritten A002 or A003 is
invalidated by this migration.** One witness improves — see §5.

## 4. The phases

Each is independently mergeable and each leaves `vp run ready` green.

**Phase 0 — the spike.** §7. Nothing below starts until it answers.

**Phase 1 — dependencies and house rules.**
`alchemy@next`, `@effect/platform-node`, `@effect/platform-bun` into the catalog in
`pnpm-workspace.yaml`, pinned exactly, matching `effect@4.0.0-rc.110`. `.alchemy/` into
`.gitignore`. A house-rule section in `CLAUDE.md` next to the Effect and Vite+ sections, saying:
infrastructure is declared in `alchemy.run.ts`, never in `wrangler.jsonc`; state files are never a
witness subject; a resource that cannot be emulated locally is claimed by what the repository
declares, never by what the cloud reports.

**Phase 2 — the core stack.** `Cloudflare.D1.Database("Database", { migrationsDir: "./migrations" })`,
`src/Stack.ts`, and `src/d1.ts`. `core`'s existing tests keep running against `node:sqlite` and
prove the migration did not touch pure logic.

**Phase 3 — the check-in Worker (A002).** `Cloudflare.Worker` with `Cloudflare.Workers.cron`,
`Cloudflare.Email.SendEmail` for the send binding, `Cloudflare.Email.Routing` / `Address` / `Rule`
for the inbound side. Witnesses per the rewritten A002.

**Phase 4 — the dashboard (A003).** `Cloudflare.Website.SvelteKit("Website")` with
`Cloudflare.InferEnv<typeof Website>` typing `App.Platform["env"]`, plus
`Cloudflare.Access.Application` and `Cloudflare.Access.Policy`.

**Phase 5 — A006.** The claims F10 deleted, now writable. §6.

**Phase 6 — the backup (A004).** `Cloudflare.R2.WriteBucket` in the backup handler and
`ReadBucket` in the restore test — the least-privilege split D1 lacks, R2 has, and it lands
exactly where A004's claim needs it.

## 5. What this does to the amendments

| Amendment      | Effect of the migration                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| A001 (enacted) | none — pure logic over an unchanged service                                                      |
| A005 (enacted) | none                                                                                             |
| A002           | witnesses unchanged; the miniflare `--local` note becomes `Test.make({ dev: true })`, pending §7 |
| A003           | one witness rises a rung; the rest unchanged                                                     |
| A004           | improved — R2's read/write split gives the restore leg a read-only handle                        |
| A006           | becomes writable at all                                                                          |

**The A003 witness that rises.** The rewritten amendment names _a test that parses
`apps/dashboard/wrangler.jsonc` and asserts the declared binding set_ — kind 2 against untyped
JSON. With `Cloudflare.InferEnv<typeof Website>` the binding set is a type, so the same property
becomes a type-level assertion. Kind 2 → kind 1, on a witness written three sessions ago against a
file this migration deletes.

**The A002 note that must be rewritten.** A002 closes with a guarantee: _every test here runs
under `wrangler dev` / miniflare with `--local`; nothing talks to Cloudflare, which is what keeps
these claims rederivable from a checkout._ That sentence is load-bearing for §4.1 and it names a
tool this migration removes. Its replacement is `Test.make({ dev: true })` — which flips every
Worker to workerd in the test process, with D1, R2, KV and Queues emulated locally and `dev:`
-prefixed ids as the proof no cloud call ran — **if and only if the spike confirms it needs no
credentials.**

## 6. A006, in outline

F10 ruled that the infrastructure claims "do not get to exist," on the ground that their state was
not rederivable from a checkout. That ruling was correct for the tooling of the day and it is a
`settled` entry, so reopening it is an operator's call, not this document's.

What changes is the premise. Each of the three now has a resource:

| F10 deleted                                      | Alchemy resource                                  | Shape of the claim                                                       |
| ------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------ |
| the Access application on the dashboard hostname | `Cloudflare.Access.Application` + `Access.Policy` | the repository declares an Access application on the dashboard hostname  |
| the apex MX records                              | `Cloudflare.DNS.Record`                           | the repository declares the apex MX records alongside the mail subdomain |
| the rate-limit rule                              | `Cloudflare.RateLimit` binding                    | the check-in form consults a rate limiter before recording               |

The third changes shape rather than returning. F10's version was a zone-level WAF rule; Alchemy's
rate limiting is a **Worker binding** — a counter the Worker consults per request. That is a
different mechanism and a better claim: it is in code, it is on the request path, and it is
testable under local emulation, where a WAF rule was none of those.

Two more become available that F10 never reached:

- **The verified destination address.** Draft 1 of A002's email claim was cut in half because
  verification happened in a dashboard. `Cloudflare.Email.Address("Inbox", { email })` declares
  it. The human still clicks the confirmation link, so what is claimable is the declaration, not
  the verification — a smaller thing than the original draft wanted, and more than nothing.
- **The Access session duration.** A003 lists _the Access session lasts 30 days_ under "not
  claimed", as a setting whose failure mode is annoyance. `sessionDuration` is a field on
  `Access.Application`. Whether annoyance deserves a claim is still a judgment; the impossibility
  is gone.

**None of these is a claim about the world.** Each is a claim about what the repository declares,
which is the same move C14 made for the mail domain. Drift between the declaration and the account
remains monitoring, and nothing here detects it.

## 7. The spike, and the risks

**The spike: does a test run need Cloudflare credentials?**

Two pages disagree. `/testing` says _Alchemy tests run against real clouds — no mocks, no
emulators_, and every sample passes `state: Cloudflare.state()`, which the state-store page says
provisions a Durable Object and writes a bearer token to `~/.alchemy/`. Tutorial part 4 says the
harness `dev` flag _flips every Worker over to workerd inside the test process_, and the
local-development page says D1, R2, KV and Queues are emulated with `dev:`-prefixed ids that
double as proof no cloud call ran.

Both can be true — local resources with remote state. If they are, `vp run ready` stops passing
from a clean checkout without an account, and that breaks a house rule and §4.1 together.

The likely resolution is the **filesystem state store**, which is the default and which the
state-store page says "works for solo development." A one-package spike settles it: a trivial
stack, local state, `Test.make({ dev: true })`, run with every `CLOUDFLARE_*` variable unset. It
either passes or it does not.

**The other risks, in order.**

1. **`alchemy@next` is a beta.** The binding API was renamed as recently as beta-58 —
   `Cloudflare.R2Bucket.bind(Bucket)` became `Cloudflare.R2.ReadBucket(Bucket)`. Churn on the
   exact surface our witnesses sit on. This repo already runs `effect@4.0.0-rc.110`, so the
   appetite is established, but a marker on a renamed API is an orphan and orphans are found by
   the form check rather than by anything failing quietly.
2. **Two bundlers.** `vp` owns build and test; Alchemy ships its own wrangler-free adapter and
   bundles Workers at deploy. They need not fight — `vp run ready` never deploys — but the
   SvelteKit path runs Vite twice over, once under `vp` and once under `alchemy dev`.
3. **Version alignment.** `@effect/platform-node` and `@effect/platform-bun` must match
   `effect@4.0.0-rc.110` exactly and must not drag a second Effect into the tree. Catalog pins,
   same as `@effect/tsgo` and `oxlint-tsgolint` got in F13.
4. **MX records are unverified.** `Cloudflare.DNS.Record` takes a `type`, and the docs show only
   `A` and `CNAME`. F2 depends on MX being declarable. Cheap to check, and it only blocks the
   second row of A006's table.

---

# Field notes

Everything below came out of reading the docs for §1–§7. It is here so the next person does not
re-read twenty pages to recover it. Facts are marked **(unverified)** where the docs implied rather
than stated them.

## 8. Read these, not those

**Start at [`alchemy.run/llms.txt`](https://alchemy.run/llms.txt).** It is a complete page index and
it is the cheapest way to find the page that answers a question.

> **Trap, and it cost this session a wrong answer.** The GitHub repo README, `alchemy/src/llms.*.txt`,
> and Context7's `/sam-goodwin/alchemy` and `/alchemy-run/alchemy` indexes all describe the **old v0.x
> API** — `await Worker("api", {...})`, plain async functions, no Effect, `.alchemy/*.json` as the
> documented state model. The current API is Effect-native and shares almost no surface with it. Only
> `/websites/alchemy_run` (Context7) and the live site are current, and where they disagree the live
> site wins.

| For                            | Page                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page index                     | [`/llms.txt`](https://alchemy.run/llms.txt) · full API ref in [`/llms-full.txt`](https://alchemy.run/llms-full.txt)                                                                    |
| the Stack model                | [`/infrastructure-as-code/stack`](https://alchemy.run/infrastructure-as-code/stack)                                                                                                    |
| **init vs runtime phase**      | [`/infrastructure-as-effects/phases`](https://alchemy.run/infrastructure-as-effects/phases)                                                                                            |
| capability tags and layers     | [`/infrastructure-as-effects/binding`](https://alchemy.run/infrastructure-as-effects/binding)                                                                                          |
| Workers                        | [`/cloudflare/compute/workers`](https://alchemy.run/cloudflare/compute/workers)                                                                                                        |
| D1 + migrations                | [`/cloudflare/data/d1`](https://alchemy.run/cloudflare/data/d1)                                                                                                                        |
| R2 and its read/write split    | [`/cloudflare/data/r2`](https://alchemy.run/cloudflare/data/r2)                                                                                                                        |
| cron triggers                  | [`/cloudflare/messaging/cron`](https://alchemy.run/cloudflare/messaging/cron)                                                                                                          |
| email, both directions         | [`/cloudflare/email/send-and-receive`](https://alchemy.run/cloudflare/email/send-and-receive)                                                                                          |
| SvelteKit                      | [`/cloudflare/frontend/sveltekit`](https://alchemy.run/cloudflare/frontend/sveltekit)                                                                                                  |
| Access / Zero Trust            | [`/providers/cloudflare/access/application`](https://alchemy.run/providers/cloudflare/access/application) · [`/access/policy`](https://alchemy.run/providers/cloudflare/access/policy) |
| zones and DNS                  | [`/cloudflare/networking/domains`](https://alchemy.run/cloudflare/networking/domains)                                                                                                  |
| rate limiting                  | [`/cloudflare/compute/rate-limiting`](https://alchemy.run/cloudflare/compute/rate-limiting)                                                                                            |
| secrets and config             | [`/environments/secrets`](https://alchemy.run/environments/secrets)                                                                                                                    |
| **what emulates locally**      | [`/environments/local-development`](https://alchemy.run/environments/local-development)                                                                                                |
| the test harness               | [`/testing/test-harness`](https://alchemy.run/testing/test-harness) · **and** [`/cloudflare/tutorial/part-4`](https://alchemy.run/cloudflare/tutorial/part-4)                          |
| state stores                   | [`/state-store`](https://alchemy.run/state-store)                                                                                                                                      |
| file layout                    | [`/project-structure/file-layout`](https://alchemy.run/project-structure/file-layout) · [`/monorepo`](https://alchemy.run/project-structure/monorepo)                                  |
| CI                             | [`/environments/ci`](https://alchemy.run/environments/ci)                                                                                                                              |
| **what changed between betas** | the blog — e.g. [beta-58](https://alchemy.run/blog/2026-06-24-beta-58) renamed the R2 bindings                                                                                         |

Two pages contradict each other and it matters. [`/testing`](https://alchemy.run/testing) says
_"Alchemy tests run against real clouds — no mocks, no emulators"_ and documents no `dev` option;
part 4 of the tutorial documents `dev: true` and local emulation. Part 4 and
`/environments/local-development` are the ones to believe — they are specific, and the overview page
appears not to have been updated. This is exactly the disagreement §7's spike settles.

**The blog is the changelog.** There is no migration guide between betas, and the binding surface has
been renamed at least once (`Cloudflare.R2Bucket.bind(Bucket)` → `Cloudflare.R2.ReadBucket(Bucket)`).
Read the beta posts between your pinned version and any version you upgrade to, because a renamed
binding turns every marker on it into an orphan.

## 9. The five idioms to understand before writing anything

**1. Init phase and runtime phase.** The outer `Effect.gen` is **init** — it runs at plantime and
once per cold start, discovers bindings, and builds clients. The handlers it returns are **runtime**
— once per request.

```ts
Cloudflare.Worker(
  "Worker",
  { main: import.meta.url },
  Effect.gen(function* () {
    const bucket = yield* Cloudflare.R2.ReadWriteBucket(Bucket); // ─── init ───
    return {
      fetch: Effect.gen(function* () {
        // ─── runtime ───
        const obj = yield* bucket.get("key");
        return HttpServerResponse.text(yield* obj.text());
      }),
    };
  }).pipe(Effect.provide(Cloudflare.R2.ReadWriteBucketBinding)),
);
```

The type system enforces the split: `Alchemy.RuntimeContext` is available **only** inside the runtime
closure, so any Effect requiring it cannot compile at plantime. Acquire in init, use in runtime — and
remember that anything you put in init runs once per cold start, not once per request.

**2. `main: import.meta.url` makes the file its own entrypoint.** The infrastructure declaration and
the runtime code live in one module. This is the idiom that reads strangest coming from wrangler, and
it is why `src/worker.ts` is both a resource and a handler.

**3. Two Worker forms, and the choice is about types.** The function form is
`Cloudflare.Worker("Worker", {...}, Effect.gen(...))`. The class form is
`class Api extends Cloudflare.Worker<Api>()("Api", {...}, Effect.gen(...)) {}`. Use the class form
when another module needs the Worker's inferred type — `typeof worker.Env`, or
`Cloudflare.InferEnv<typeof Website>` for a site.

**4. A binding is a capability tag, not an implementation.** From the bindings page:
_"`ReadWriteBucket` is a `Binding.Service` — a callable Context tag. It names the capability and says
nothing about how it's satisfied."_ Each capability ships several interchangeable layers:

| Layer suffix | Satisfied by                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `…Binding`   | the native Cloudflare binding                                                      |
| `…Http`      | Cloudflare's HTTP API with a scoped token                                          |
| `…Local`     | CLI credentials — e.g. `Cloudflare.D1.QueryDatabaseLocal`, used inside an `Action` |

Handler code never changes when you swap layers. **This is the extension point the migration relies
on**: `core`'s `Database` is the same pattern, and a fourth layer over `QueryDatabase` is all it needs.

**5. Least privilege exists for R2 and not for D1.**

```ts
yield * Cloudflare.R2.ReadBucket(Bucket); // head / get / list
yield * Cloudflare.R2.WriteBucket(Bucket); // put / delete / multipart
yield * Cloudflare.R2.ReadWriteBucket(Bucket); // both
yield * Cloudflare.D1.QueryDatabase(Database); // prepare / bind / all / first / run / exec
```

There is no `D1.ReadDatabase`. `run` is documented as executing mutations, and `all` on
`INSERT … RETURNING` writes as well. Plan for the narrowing to be yours to build.

## 10. Traps

**`Config` always binds as a secret.** From the secrets page: when you `yield*` a Config value in
init _"it is always bound as a secret (`secret_text` on Cloudflare) regardless of which `Config`
constructor you use."_ So `Config.string("HOST")` is a secret binding too. Values come from the
environment of whoever runs the deploy, which is what keeps them out of the repository — and what
makes a missing variable a deploy-time failure rather than a type error.

**Access policies are standalone resources, not inline config.** Create the policy, then reference
its id:

```ts
const allow =
  yield *
  Cloudflare.Access.Policy("AllowMe", {
    decision: "allow",
    include: [{ emailDomain: { domain: "example.com" } }],
  });
yield *
  Cloudflare.Access.Application("Dashboard", {
    type: "self_hosted",
    domain: "dashboard.example.com",
    sessionDuration: "24h",
    policies: [allow.policyId],
  });
```

**Cron needs a layer as well as a call.** `Cloudflare.Workers.cron(expr, handler)` attaches the
expression at deploy time, and the scheduled listener needs `CronEventSourceLive` provided. Call
`cron` more than once for more than one schedule. The controller carries `scheduledTime` and `cron`.

**Migrations run on every deploy.** `migrationsDir` sorts `.sql` files by numeric prefix, applies
them in order, and skips the applied set — tracked in a table you can rename with `migrationsTable`.
Nothing here is opt-in per deploy, so a bad migration file is a deploy-time event.

**Stages are implicit and they are how you avoid clobbering prod.** Default is `dev_$USER`; tests
default to a `test` stage; CI maps pull requests to `pr-{number}` and `main` to `prod`. Cross-stack
reads resolve within the current stage, so a `pr-42` frontend reads a `pr-42` backend. Getting a
stage wrong is how a test destroys something real.

**Resources with no local provider deploy for real during `alchemy dev`.** Emulated: Workers (in
workerd), D1, R2, KV, Queues, and worker-only bindings including email. Everything else — Hyperdrive,
Vectorize, and **(unverified, but consistent with the docs) Access applications, zones and DNS
records** — goes to the cloud in your personal stage. `Alchemy.remote()` opts a resource out of
emulation deliberately; nothing opts a non-emulable resource in. Local resource ids are `dev:`
-prefixed, which the docs offer as proof no cloud call ran.

**`alchemy plan` reads the state store.** It is documented as equivalent to `deploy --dry-run`, with
no prompt and no changes. Whether it works with no credentials is undocumented and depends on the
state store; with `Cloudflare.state()` it certainly does not. Do not build a witness on it.

**`--adopt` imports existing cloud resources into a fresh state store.** This is the escape hatch if
state is lost, and the way to bring an already-provisioned account under management rather than
recreating it. Worth knowing before you need it, not after.

**`ALCHEMY_DEV` is readable from inside a program**: `if (yield* ALCHEMY_DEV) { … }`, imported from
`alchemy`. Useful, and a place production behaviour can diverge from what any local test observes —
so it is a thing to grep for during an audit.

# Does an Alchemy test run need Cloudflare credentials?

The spike [`.scratch/ALCHEMY-MIGRATION.md`](../../.scratch/ALCHEMY-MIGRATION.md) §7 asks for.
Everything below `.md` in this directory is the run that answered it.

## Why it was asked

Two Alchemy pages disagreed, and the disagreement was load-bearing. `/testing` says _"Alchemy
tests run against real clouds — no mocks, no emulators"_ and every sample there passes
`state: Cloudflare.state()`, which provisions a Durable Object. Tutorial part 4 says the test
harness's `dev` flag flips every Worker to workerd inside the test process, with `dev:`-prefixed
resource ids as proof no cloud call ran.

If the first page governed, `vp run ready` would stop passing from a clean checkout without a
Cloudflare account. That breaks a house rule and A002 §4.1 together, which is why nothing in the
migration was allowed to start until this ran.

## The answer, in two halves

**A dev-mode run never contacts Cloudflare.** D1 is emulated on disk, the Worker runs in workerd,
the filesystem state store is a directory of JSON provisioned by nothing, and the database id
comes back `dev:`-prefixed. `spike.test.ts` serves a real HTTP request that writes and reads the
emulated database, and the whole file runs in under four seconds.

**It still resolves credentials, eagerly, before it can know that.** With `HOME` pointed at an
empty directory and every `CLOUDFLARE_*` variable unset, `Cloudflare.providers()` fails at layer
construction and the test file never runs:

```
AuthError: No credentials configured for 'Cloudflare' in profile 'default', and this process is
non-interactive so it can't be configured interactively. Run `alchemy login --profile default`
to configure it, or set CI=1 to use environment-variable credentials.
```

`CI=1` moves the failure rather than fixing it — `AuthError: Missing required env:
CLOUDFLARE_ACCOUNT_ID`.

**So the credentials are required and unused.** Placeholders satisfy the resolver: a 32-character
all-zero account id and a nonsense token, with `HOME` empty and no `~/.alchemy/` anywhere, and
all three tests pass. Alchemy validates the shape of an account id, not the value, and in dev
mode nothing ever authenticates with either.

That is what the `test.env` block in the root [`vite.config.ts`](../../vite.config.ts) supplies,
and why the placeholders are deliberately non-functional: a test that escapes dev mode fails to
authenticate instead of quietly deploying into a real account.

**A named Alchemy profile cannot substitute for this.** `Auth/Profile.ts` fixes the profile root
at `path.join(os.homedir(), ".alchemy")`, with `profiles.json` there and per-provider secrets
under `credentials/{profile}/`. `ALCHEMY_PROFILE` selects which profile to read; nothing relocates
where profiles live. So a fake dev profile is a file two directories into `$HOME` that every
developer and every CI runner would have to create by hand — a per-machine setup step, which is
exactly what a witness rederivable from a checkout cannot depend on.

## What else it cost, and what that is worth knowing

Three things went wrong on the way, none of them predicted by the field notes, and all three are
now house rules in [`AGENTS.md`](../../AGENTS.md):

1. **`main: import.meta.url` reads the module's `default` export.** A Worker exported by name
   bundles to `"default" is not exported by "alchemy.run.ts"` — at deploy time, not at
   type-check time. This is what forced the Worker into its own `src/worker.ts`, which is the
   layout the migration wanted anyway.
2. **A module a Worker bundles may not compute paths from `import.meta.url`.** `src/database.ts`
   is imported by the Worker, so `new URL("../migrations", import.meta.url)` was evaluated at
   cold start inside workerd, which dies with `Invalid URL string`. The failure surfaces as a
   30-second test timeout with the real error buried in a log line. `migrationsDir` is only ever
   read at plan time, so an inert relative string is both sufficient and the only thing that
   survives the bundle.
3. **The stack's class form does not work the way its types claim.** `class S extends
Stack<S>()("name", options, effect) {}` type-checks and then dies with `Fiber.runLoop: Not a
valid effect: undefined`. Only the reference form — `Stack<Self, Shape>()("name")`, with a
   separate `.make(options, effect)` — is piped through Alchemy's `effectClass`. `packages/core`
   uses the form that runs.

## Running it

```
vp run --filter @feelsie/alchemy-credentials-spike spike
```

To reproduce the second half of the answer — the part where it fails — comment out the `test.env`
block in the root `vite.config.ts` and run it with `HOME` pointed at an empty directory.

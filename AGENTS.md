# Feelsie

Sends one email a day, records mood, energy, and sleep from a link in it, and shows the history
on a private page. Two Cloudflare Workers use one D1 database. The core package exists. The
Workers remain proposed.

## This project dogfoods crux

**Crux is a conceptual framework for organising requirements so that it is cheap to judge whether
a codebase satisfies them.** Its vocabulary is used throughout this repository's documentation,
and reading it as ordinary English will produce confident mistakes — `claim`, `witness`,
`standing`, `verdict`, and `coverage` are precise terms here.

> **Read [`CRUX.md`](./CRUX.md) before writing a claim, a witness, a marker, or an amendment.** It
> is the short form: the rules, and none of the arguments.

**The arguments live in crux's own repository, which is not vendored here. If no path to it was
given to you, ask the user for one before doing design work.**

No tooling implements crux yet, so every artifact in this repository is maintained by hand. That
friction is the point:

> **When the framework strains, say so in your report and record it in
> [`.scratch/CRUX-FEEDBACK.md`](./.scratch/CRUX-FEEDBACK.md). Working around it silently destroys
> the only data this project exists to produce.**

Two things are being measured, and the distinction is the whole experiment. A by-hand step that
felt **clerical** is a candidate for tooling to absorb. A by-hand step that felt like **thinking**
must never be automated. Sort what you noticed into one of those two when you record it, and put
the running account in [`.scratch/FOG-LOG.md`](./.scratch/FOG-LOG.md).

## Where things live

| If you need                             | Read                                   |
| --------------------------------------- | -------------------------------------- |
| What this project is                    | [`ABSTRACT.md`](./ABSTRACT.md)         |
| How claims and witnesses work           | [`CRUX.md`](./CRUX.md)                 |
| What a word means                       | [`GLOSSARY.md`](./GLOSSARY.md)         |
| What the system promises **now**        | [`docs/catalog/`](./docs/catalog/)     |
| Why a promise reads as it does          | [`docs/rationale/`](./docs/rationale/) |
| Why something broken isn't              | [`docs/gotchas.md`](./docs/gotchas.md) |
| How to perform a one-time setup by hand | [`docs/runbooks/`](./docs/runbooks/)   |
| What is undecided, and what gets built  | [`.scratch/`](./.scratch/)             |
| What a spike ran, and what it found     | [`prototypes/`](./prototypes/)         |

New writing goes to one of those homes from the start, and **nothing lives in two of them**.

The catalog contains only affirmed claims. A claim enters in the merge that makes it true.
Everything proposed lives in `.scratch/`: `fog.md` for what cannot be stated as a claim, and
`amendments/` for what can.

## House rules

- **Conventional Commits, always.** The allowed types are in
  [`commitlint.config.ts`](./commitlint.config.ts); CI checks every commit on a PR and the PR
  title, because a squash merge takes the title as the subject.
- **`vp run ready` is the gate.** It runs `vp check` (format, lint, type-check), then every
  package's `test`, then every package's `build`. A change is not done until it passes from a
  clean checkout.
- **Gate commands live in `package.json`, not in `run.tasks`.** `vp run` reads both, and
  `run.cache: true` already caches scripts, so a task wrapper adds only `dependsOn`/`env`/
  `input` control — nothing a linear `check → test → build` chain needs. Scripts stay visible
  to pnpm, CI, and editors, and a task name can live in only one place. Define a
  `vite.config.ts` task when it needs cross-package ordering or env-sensitive caching.
- **Absolute imports across modules.** `../**` is a lint error; sibling imports are fine.
- **No `any`, no non-null assertions, no floating promises.** These are lint errors, not
  preferences. If a rule seems wrong for this repo, change it in
  [`vite.config.ts`](./vite.config.ts) with a comment saying why — do not suppress it inline.
- **Dependencies come from the catalog.** Shared versions live in
  [`pnpm-workspace.yaml`](./pnpm-workspace.yaml); packages depend on `catalog:`.
- **Dead code gets deleted.** `vp exec fallow` reports what nothing reaches. A file that is
  only reachable at runtime belongs in `fallow.toml`; everything else it flags is real.
- **Effect v4, from day one.** Chosen before any code, because it moves claims up the witness
  ladder rather than annotating them — see
  [`docs/rationale/core-is-written-in-effect.md`](./docs/rationale/core-is-written-in-effect.md).
  The Effect-native patterns come from [`Effect-TS/skills`](https://github.com/Effect-TS/skills)
  and the type-aware linter in [`Effect-TS/tsgo`](https://github.com/Effect-TS/tsgo).
- **Infrastructure is declared in `alchemy.run.ts`, never in `wrangler.jsonc`.** Every
  Cloudflare resource this project uses is a TypeScript value inside the repository. There is
  no second place to look, and no `wrangler.jsonc` to drift from.

## Infrastructure is declared, and only the declaration is claimable

Three rules, and the third is the one that gets broken by accident:

- **A claim's subject is what the repository declares, never what the account contains.** F10
  settled that a claim about live infrastructure does not belong in the catalog, and adopting
  Alchemy refines it rather than reopening it: there is now a declaration to make a claim
  about. Drift between the declaration and the account is monitoring, and nothing here detects
  it.
- **State files are never a witness subject.** `.alchemy/` is gitignored. It describes an
  account at a moment; a witness that reads it is attesting to a machine, not to a checkout.
- **A resource that cannot be emulated locally is claimed by what the repository declares.**
  Workers, D1, R2, KV, Queues, and the email bindings run locally under `dev`. Access
  applications, zones, and DNS records do not — during `alchemy dev` they deploy for real into
  your personal stage. A test that touches one is not a witness.

**No test ever holds a real Cloudflare credential.** The `test.env` block in
[`vite.config.ts`](./vite.config.ts) assigns placeholders — an all-zero account id, a nonsense
token, `CI=1`, `ALCHEMY_DEV=1` — to `process.env` before any test runs, overriding whatever the
developer's shell and `~/.alchemy/` hold. Alchemy resolves Cloudflare credentials eagerly, before
it knows a stack is fully emulated, so a checkout with no account cannot even build the provider
layer; it never _uses_ them in dev mode. That is what keeps `vp run ready` passing from a clean
checkout, and being non-functional is the point: a test that escapes dev mode fails to
authenticate instead of quietly deploying to a real account. `CI=1` matters as much as the
credentials — it forces the environment-variable path, so a developer who has run `alchemy login`
gets the same run as CI rather than a quietly different one. The evidence is
[`prototypes/alchemy-credentials-spike/`](./prototypes/alchemy-credentials-spike/).

**A profile cannot do this job.** Alchemy's profiles live at `~/.alchemy/profiles.json` with
secrets under `~/.alchemy/credentials/`, and that root is `os.homedir()` with no repository-local
override. A "dev profile with fake credentials" is a per-machine setup step, which is the one
thing a clean checkout cannot have.

**A stack picks its state store on `ALCHEMY_DEV`, and never unconditionally.** State records which
resources already exist, so it has to outlive the machine that made them: two laptops and a CI
runner are three empty `.alchemy/` directories, and an empty state store does not mean "nothing
exists", it means "create everything". Real deploys use `Cloudflare.state()`, the shared
Durable-Object store; tests and `alchemy dev` must not. Every `alchemy.run.ts` branches:

```ts
const state = Layer.orDie(Layer.unwrap(Effect.map(ALCHEMY_DEV, (dev) => (dev ? localState() : Cloudflare.state()))));
```

Declaring `Cloudflare.state()` unconditionally type-checks and breaks every test. The stack's own
`state:` wins over anything `Test.make` passes — `evalStack` provides `stack.services`, which
already carries the layer — so the failure is an `AuthError` before the first test runs.

**Deploys run from the workspace root, with `vp exec -F`, never `vp run`.**

```
vp exec -F @feelsie/core alchemy deploy --stage prod
```

`vp run` forwards only an allowlist — `HOME`, `USER`, `PATH`, `SHELL`, `LANG`, `TZ`,
`NODE_OPTIONS`, `CI`, `VERCEL_*`, `NEXT_*` — and `CLOUDFLARE_*` is not on it, so a deploy through
`vp run` silently loses the credentials CI supplies. `vp exec` passes the environment through, and
`-F` sets the working directory to the package without anyone having to `cd`. A Vite Task cannot
fix this: `cache: false` and `untrackedEnv` are mutually exclusive in the task type, and a deploy
may be neither cached nor starved of credentials.

**The working directory is not cosmetic.** `alchemy.run.ts` is resolved against it, and so is
`localState()`'s `.alchemy/` — deploying one stack from two directories gives it two local state
stores that disagree about what exists. `-F` makes the directory a property of the command rather
than of the shell. `migrationsDir` is deliberately immune: `alchemy.run.ts` resolves it from
`import.meta.url`, so it does not care where the deploy was launched.

**Omitting `--stage` is a decision, not a default.** It means `dev_$USER` — a personal stage with
its own database. Production is `--stage prod`.

Two mechanical traps, both found the expensive way:

- **A module a Worker bundles may not compute paths from `import.meta.url`.** It is evaluated
  at cold start inside workerd, which dies with `Invalid URL string`. Plan-time-only modules
  like `alchemy.run.ts` are free to.
- **`main: import.meta.url` reads the module's `default` export.** A Worker exported by name
  bundles to `"default" is not exported`, at deploy time rather than at type-check time.

## Definition of done

A change is done when every claim its amendment adds is affirmed by a sound witness; the
production path is reachable through a real entrypoint; `vp run ready` passes from a clean
checkout; and the documentation is updated where implementation invalidated an assumption.

Three rules decide where a piece of new writing goes:

- **A new word means a `GLOSSARY.md` entry**, settled before the claims that use it.
- **A decision something could plausibly violate becomes a claim**, with a witness named in the
  same breath. Assigning the witness is where the design happens — a claim recorded without one
  is a wish.
- **A decision nothing could violate becomes a rationale and no claim.** It earns the document
  only when it is hard to reverse, surprising without the reasoning, and the result of a real
  trade-off — and the document names what was rejected, which is the half the code cannot show.

## Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.

## Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

### Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

### Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

### Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

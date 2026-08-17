# Feelsie

Sends one email a day, records mood, energy, and sleep from a link in it, and shows the history
on a private page. Two Cloudflare Workers use one D1 database. The core package exists. The
Workers remain proposed.

## This project dogfoods crux

**Crux is a conceptual framework for organising requirements so that it is cheap to judge whether
a codebase satisfies them.** A **claim** is a falsifiable statement the codebase must satisfy; a
**witness** is a mechanism that judges it; the **catalog** is the set of claims the project
promises now; **fog** is material wanted but not yet statable as a claim; an **amendment** is the
set of claim changes one unit of work proposes.

**Crux lives in a separate repository and is not vendored here. If no path to it was given to
you, ask the user for one before doing design work.** The vocabulary above is used throughout
this repository's documentation, and reading it as ordinary English will produce confident
mistakes — `witness`, `standing`, and `verdict` in particular are precise terms here.

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
| What a word means                       | [`GLOSSARY.md`](./GLOSSARY.md)         |
| What the system promises **now**        | [`docs/catalog/`](./docs/catalog/)     |
| Why a promise reads as it does          | [`docs/rationale/`](./docs/rationale/) |
| Why something broken isn't              | [`docs/gotchas.md`](./docs/gotchas.md) |
| How to perform a one-time setup by hand | [`docs/runbooks/`](./docs/runbooks/)   |
| What is undecided, and what gets built  | [`.scratch/`](./.scratch/)             |

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

## Skills

[`.agents/skills/`](./.agents/skills/) holds skills this repo expects you to use:

- [`grilling`](./.agents/skills/grilling/SKILL.md) — stress-test a plan or decision before
  building it.
- [`codebase-design`](./.agents/skills/codebase-design/SKILL.md) — the design vocabulary this
  repo uses: **module**, **interface**, **implementation**, **adapter**, **seam**, **depth**.
- [`writing-for-agents`](./.agents/skills/writing-for-agents/SKILL.md) — writing a skill, this
  file, or any document an agent consumes.
- [`wizard`](./.agents/skills/wizard/SKILL.md) — generating a walkthrough for steps only a human
  can perform, which is what [`docs/runbooks/`](./docs/runbooks/) holds.

`.claude/` is a symlink to `.agents/`, and `CLAUDE.md` is a symlink to this file, so every
agent reads one set of instructions. `CLAUDE.md` is gitignored and created on install by
[`scripts/link-agents.mjs`](./scripts/link-agents.mjs) — the file's own header says why.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

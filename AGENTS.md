# <Project>

<!-- One paragraph: what this repo is, and what it is not. Replace everything above the House
rules section — those are the parts the baseline template ships and expects you to keep. -->

## Where things live

| If you need                    | Read                                   |
| ------------------------------ | -------------------------------------- |
| What this project is           | [`ABSTRACT.md`](./ABSTRACT.md)         |
| What a word means              | [`CONTEXT.md`](./CONTEXT.md)           |
| Why something is the way it is | [`docs/adr/`](./docs/adr/)             |
| Why something broken isn't     | [`docs/gotchas.md`](./docs/gotchas.md) |

New writing goes to one of those homes from the start, and **nothing lives in two of them**.
Delete the rows this repo does not have yet rather than leaving dangling links.

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

## Definition of done

A change is done when its production path is reachable through a real entrypoint; success and
expected failure are tested; `vp run ready` passes from a clean checkout; and the documentation
is updated where implementation invalidated an assumption — a new decision means a new ADR, a
new term means a `CONTEXT.md` entry.

## Skills

[`.agents/skills/`](./.agents/skills/) holds skills this repo expects you to use:

- [`grilling`](./.agents/skills/grilling/SKILL.md) — stress-test a plan or decision before
  building it.
- [`codebase-design`](./.agents/skills/codebase-design/SKILL.md) — the design vocabulary this
  repo uses: **module**, **interface**, **implementation**, **adapter**, **seam**, **depth**.
- [`code-review`](./.agents/skills/code-review/SKILL.md) — review a change against both repo
  standards and its spec.

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

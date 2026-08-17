# baseline

A Vite+ monorepo template: the toolchain setup that every repo here starts from, already wired
together. Use it as a GitHub template repository ("Use this template" → new repo) or clone it
and delete the git history.

## What's in the box

| File                                                     | What it settles                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`vite.config.ts`](./vite.config.ts)                     | Oxlint rules, Oxfmt style (120 cols, double quotes, sorted imports), staged-file checks, Vitest defaults |
| [`tsconfig.json`](./tsconfig.json)                       | Strict TypeScript, bundler resolution, no implicit `any`, no unchecked index access                      |
| [`pnpm-workspace.yaml`](./pnpm-workspace.yaml)           | Workspace globs and the dependency catalog                                                               |
| [`commitlint.config.ts`](./commitlint.config.ts)         | Conventional Commits, with the allowed type list                                                         |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | `vp run ready`, commit-message lint, and PR-title lint on every PR                                       |
| [`fallow.toml`](./fallow.toml)                           | Dead-code, duplication, and complexity analysis                                                          |
| [`.vite-hooks/`](./.vite-hooks/)                         | `pre-commit` → `vp staged`, `commit-msg` → commitlint                                                    |
| [`AGENTS.md`](./AGENTS.md)                               | Agent instructions, with `CLAUDE.md` symlinked to it                                                     |
| [`.agents/skills/`](./.agents/skills/)                   | `grilling`, `code-review`, `codebase-design`, with `.claude/` symlinked to `.agents/`                    |

`prepare` runs on install, so the git hooks install themselves and the agent symlinks repair
themselves on the first `vp install`.

## Generating a project from it

```bash
vp create github:ferntheplant/baseline
```

Answer the prompts — the first one is the target directory, so the new project is named there
and needs no renaming afterwards. Take the default on **Which coding agent instruction files**
(`AGENTS.md, CLAUDE.md`) or answer none; both give you `CLAUDE.md` symlinked to `AGENTS.md`.
Selecting `CLAUDE.md` alone is the one answer to avoid — Vite+ then writes a real `CLAUDE.md`
holding only its own boilerplate, and this repo's house rules never reach Claude Code.

That leaves a fresh repo on `main` with no commits, no template history, dependencies
installed, and the commit hooks configured.

Non-interactively (`--no-interactive`), pass `--git` for the repo and expect the directory to
be named after the template, since `--directory` is rejected for remote templates:

```bash
vp create github:ferntheplant/baseline --git --no-interactive && mv baseline <name>
```

`git clone https://github.com/ferntheplant/baseline.git <name>` works too, if you would rather
delete `.git` yourself.

Two things about the `vp create` route are worth knowing, both handled by
[`scripts/link-agents.mjs`](./scripts/link-agents.mjs) running from `prepare`. It extracts with
degit, which rewrites relative symlinks into absolute paths inside a cache directory it then
deletes, so `.claude/` arrives dangling; the same is true of "Download ZIP", which drops
symlinks entirely. And `vp create` writes agent instruction files itself before installing,
which is why `CLAUDE.md` is gitignored here rather than committed — see the script's header.
Nothing to do by hand, but if agent instructions ever go missing in a generated repo, that is
where to look.

## Then, in the new repo

1. Rename the root package: `@baseline/root` → `@<yourname>/root` in `package.json`.
2. Rename or replace `apps/example`. It exists because `vp run ready` fans out to every
   package's `test` and `build` scripts, and a workspace with no packages has neither task to
   plan — `vp run -r test` fails with `Task "test" not found`. Keep at least one package with
   both scripts, and the gate stays honest.
3. Rewrite [`AGENTS.md`](./AGENTS.md) above the **House rules** section: what this project is,
   and where its documentation lives. Delete table rows that point at files you do not have.
4. Replace this README.
5. `vp run ready`, then make the first commit and push it to a new GitHub repo.
6. Configure the GitHub settings below — they cannot be committed.

## Daily commands

```bash
vp run ready       # the gate: check, then every package's test, then every package's build
vp check --fix     # format + autofix lint
vp test            # run tests
vp exec fallow     # dead code, duplication, complexity
```

## Manual GitHub settings

Two things live in repository settings rather than in this repo, so they have to be set once
per repo after publishing.

### 1. Protect `main` with a ruleset

**Settings → Rules → Rulesets → New ruleset → New branch ruleset**

- **Name**: `main`
- **Enforcement status**: Active
- **Target branches**: Add target → **Include default branch**
- Enable these rules:
  - **Restrict deletions**
  - **Block force pushes**
  - **Require linear history**
  - **Require a pull request before merging** — required approvals `0` if you work solo, and
    check **Dismiss stale pull request approvals when new commits are pushed**
  - **Require status checks to pass** — check **Require branches to be up to date before
    merging**, then add the check named **`validate`** (the job id in
    [`ci.yml`](./.github/workflows/ci.yml); it only appears in the picker after CI has run at
    least once, so push a first PR before adding it)

Rulesets, not the older "branch protection rules": they are additive, they show which rule
blocked a push, and the same ruleset can be reused across repos.

### 2. Delete the branch when a PR merges

**Settings → General → Pull Requests → Automatically delete head branches**

Or with the `gh` CLI, from a clone of the repo:

```bash
gh repo edit --delete-branch-on-merge
```

While you are there, restricting merges to **Squash merging** keeps the linear history the
ruleset requires — and squash merges take the PR title as the commit subject, which is why CI
lints that title.

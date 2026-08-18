# A007 — the house rules

**Project**: `root` · **Package**: the repository root · **Status**: proposed · **Gated by**:
nothing

The repository's own promises about how it is built. Four `@kind development` claims, three of
them witnessed by lint rules that are **already enabled and already denying** — the work is the
markers and the catalog entries, not the enforcement.

## Why this is the amendment with no gate

[F11](../fog.md) settled the direction (Effect-native patterns, carried by the Effect linter's
rule ids), [F13](../fog.md) confirmed the path end to end, and [C15](../CRUX-FEEDBACK.md) recorded
why it is cheap: the handle is the rule id, the marker's home is the config line that declares it,
and Oxlint already reports it. The chain closes with nothing built.

> rule id in `vite.config.ts` → marker on that line → Oxlint report → verdict

`amendments/README.md` has said for three revisions that these are "deferred — sequencing, not
doubt". Every other outstanding amendment waits on A002, A003, or the Alchemy phases. This one
waits on nothing, which makes it the cheapest way to move the catalog and the only one that can
land beside any of them.

## The altitude problem, met head-on

**The obvious version of this amendment is one claim per lint rule, and it is wrong.** That is the
error A005 corrected in `core`: grouping by the check that finds a defect rather than by the
failure a reader sees. Fifteen rules are enabled in `vite.config.ts`; fifteen claims would make the
catalog unreadable and would put the instrument's name in the claim, which is crux §5.9 and test 4
both.

So the rules are grouped by what goes wrong, and most of them are not claimed at all.

**Style rules get no claim.** `prefer-template`, `no-else-return`, `no-inferrable-types`,
`prefer-as-const`, `no-console`, `consistent-type-imports`, `prefer-number-properties`,
`self-closing-comp`, and the React rules are all enabled and all stay unclaimed. Something can
plausibly violate them, which is test 1 — but nothing a reader would ever _see_ differs, which is
test 4's other half. They are the house's taste and they are enforced; they promise nothing.

**The discriminator, written down because it took a while to find:** a lint rule earns a claim when
the code it forbids produces a failure somebody notices at runtime or on a release. A rule that
only makes the diff tidier does not.

## Add

### `root/code/nothing-silently-discards-work`

**Kind**: development
**Claim**: A computation that is created is run. An Effect or a promise that is constructed and
then dropped is not representable in this repository's source.

**Witnesses** — two:

| Kind | Attests                                                                         |
| ---- | ------------------------------------------------------------------------------- |
| lint | `effecttsgo/floating-effect` — an Effect value that is built and never executed |
| lint | `typescript/no-floating-promises` — the same defect for promises                |

**Coverage.** One visible failure, two value kinds, and both are needed because the two rules do
not overlap: Effect programs and promises are separate types and each rule is blind to the other.
The failure a reader sees is the worst-behaved one in the system — _the thing I asked for did not
happen, and nothing said so_.

**This project has already been bitten by the shape of it.**
[`prototypes/cron-send-email-spike/`](../../prototypes/cron-send-email-spike/) found Alchemy's cron
event source discarding a failed send and reporting success. That is not a floating Effect and
these rules would not have caught it — but it is the same category of harm, and it is why the
claim is worth having at reader-visible altitude rather than filed as "we lint for it".

**Why the marker is enough and a test would be wrong.** Crux §8.3 warns explicitly against writing
a test that reads the config and asserts a rule is on; the marker's position on the severity line
already does that job. F13 confirmed `effecttsgo/floating-effect` denies a deliberate violation
through `vp lint`, with the same report format and exit status as any other Oxlint rule.

### `root/code/the-type-checker-is-not-escaped`

**Kind**: development
**Claim**: No source in this repository opts out of the type checker. There is no `any` and no
non-null assertion.

**Witnesses** — two:

| Kind | Attests                                                            |
| ---- | ------------------------------------------------------------------ |
| lint | `typescript/no-explicit-any` — the escape hatch for a whole type   |
| lint | `typescript/no-non-null-assertion` — the escape hatch for one null |

**Coverage.** Two rules, two different escapes, one visible failure: a crash on a path the types
said could not happen. They are not redundant — `any` discards a type wholesale where `!` keeps the
type and lies about one value, and code passes each rule while breaking the other.

**This is the claim the rest of the catalog leans on.** Every kind-1 witness in this repository —
A003's read-only database handle, A004's `ReadBucket` restore leg, A006's single-source domain — is
a promise that a violation is _unrepresentable_. One `as any` at the wrong seam turns all of them
back into kind-4 witnesses without changing a line of the code they guard, and nothing announces
it. That is why it belongs in the catalog rather than in `AGENTS.md` alone.

### `root/code/cross-module-imports-are-absolute`

**Kind**: development
**Claim**: A module reaches another module by its package specifier, never by a relative path that
climbs out of its own directory. Sibling imports are unrestricted.

**Witnesses** — one:

| Kind | Attests                                                                 |
| ---- | ----------------------------------------------------------------------- |
| lint | `eslint/no-restricted-imports`, on the `../**` pattern in the rules map |

**Coverage.** Under-covered, deliberately, and this is the honest reading rather than a gap to
paper over. The rule forbids the way in — a path that climbs — and nothing here attests the
positive form. §5.8 says to check that first on any claim whose witnesses are all prohibitions, and
the opposite-polarity witness would have to observe that packages actually resolve each other
through their specifiers, which is what `vp run ready` does from a clean checkout and what no
marker names.

Recorded as under-covered at the entry gate rather than discovered at the audit. The repair is a
witness, not a lower claim — but the witness is a build, and crux has no rung for "the gate passed".

**The failure is real and delayed.** A relative climb across a package boundary resolves in the
workspace and breaks the moment the package is built or published, because the dependency it
implies was never declared. It works on the machine that wrote it, which is the property that makes
it worth a rule.

### `root/lint/type-aware-rules-are-enforced`

**Kind**: development
**Claim**: The type-aware lint pipeline is available and denying. A rule that this repository
enables reports a violation rather than passing over it.

**Witnesses** — one:

| Kind | Attests                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------- |
| test | a fixture that violates a type-aware Effect rule is reported by `vp lint`, with a non-zero exit |

**Coverage.** One witness, and it needs to be the fixture rather than a config read. The claim is
not "the rule is configured" — that is what the markers above already say — it is "the machinery
behind those markers still works".

**This is [C15](../CRUX-FEEDBACK.md)'s deferred claim, and the failure mode is the reason it
exists.** Oxlint sits at exactly the floor `@effect/tsgo` requires and arrives transitively through
`vite-plus` rather than through the catalog. The Effect integration works by **patching installed
Oxlint files**, reapplied by the root `prepare` script after every install. So the pipeline breaks
by rules quietly not firing — not by anything failing. Every other claim in this amendment would go
green on the day its witness stopped running.

**And here is the part crux has no word for.** The three claims above are witnessed by lint rules.
This one is a claim _about those witnesses_, and its subject is the instrument rather than the
code. CRUX.md's test 4 says a claim that describes its own witness is at the wrong altitude — and
this claim describes somebody else's, which the test does not reach. It is either a legitimate new
shape or the exception that shows the test needs a scope. Recorded as
[C27](../CRUX-FEEDBACK.md); the amendment proceeds with it because the failure it names is real,
silent, and would otherwise be nobody's.

## What is deliberately not claimed

- **Conventional Commits.** Enforced by commitlint in CI, on a subject line rather than on the
  codebase. Nothing in a checkout is different if it is violated, so it fails test 2 — its state is
  not rederivable from the repository, it is a property of a history.
- **Dependencies come from the catalog.** `catalogMode: prefer` makes `vp add` reach for a catalog
  entry; it does not forbid a version range. A claim would need a witness that reads every
  `package.json` for a non-`catalog:` dependency, which is a custom check nobody has written. Real,
  writable later, and honestly fog-adjacent rather than deferred: this is an unwritten amendment.
- **Dead code gets deleted.** `vp exec fallow` reports it and is not in `vp run ready`, so no
  witness runs at the gate. Making it a claim means putting it in the gate first, and that is a
  decision about build time nobody has taken.
- **Infrastructure is declared in `alchemy.run.ts`, never `wrangler.jsonc`.** This one is close and
  it belongs to A006 rather than here, because the witness has to read the declaration modules that
  A006 introduces.
- **Every enabled style rule.** See the discriminator above.

## The work

1. Group the four claims into `docs/catalog/` — a new file, because `core.md` holds capability
   claims about the product and these are development claims about the repository.
2. Mark the three lint witnesses in [`vite.config.ts`](../../vite.config.ts). **Each needs its own
   `@attests:end`**: a block's default extent runs to the next block or the end of the file, and
   inside a rules map that would swallow every rule below it. The existing
   `root/token/cannot-be-guessed` marker in the `overrides` array is the pattern.
3. Write the fixture test for the fourth. It is the only new code in the amendment.
4. Audit claim by claim. `root/code/cross-module-imports-are-absolute` is expected to come back
   **under-covered**, and that is recorded above rather than discovered — the audit should confirm
   it, not find it.

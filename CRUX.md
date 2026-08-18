# Crux, in short form

Crux is a conceptual framework for organising requirements so that it is cheap to judge whether a
codebase satisfies them. Feelsie is its first adopter and its test subject.

This file is the operational form: the rules, and none of the arguments. **The arguments live in
crux's `ABSTRACT.md`, in a separate repository that is not vendored here.** If you have no path to
crux, ask the user for one before doing design work.

Read this file before you write a claim, a witness, a marker, or an amendment.

**This file is sufficient on its own. Do not read `ABSTRACT.md` to prepare.** It runs to some
eighteen hundred lines, most of it the reasoning behind rules already stated here, and reading it
before you need it spends a session's attention on arguments you were not going to reopen.

The section numbers below — crux §5.9, crux §6.6 — are backward references, not reading
assignments. Follow one for exactly two reasons: a rule here is ambiguous **for the case in front
of you**, or you are revising this file and need to check it still matches its source. Otherwise
they are provenance, and the right time to read one is when you already know which rule you are
questioning.

## The model in one paragraph

The **catalog** holds every **claim** the project promises now. Each claim is falsifiable prose
with a stable slug. A **witness** is a mechanism that judges a claim; a witness exists only as a
**marker**, which is a comment carrying `@attests`. A **rationale** says why a claim reads as it
does, and reaches its claims by a **grounding** — a `@grounds` line naming each slug it explains.
A **canvass** asks every witness for a **verdict** about the code. An **audit** reads the
witnesses themselves and sets a **standing** for each, then a **coverage** for the claim. A human
**ruling** at the merge closes what the machine could not decide.

The slug is the hub. A marker names its claims, a rationale names its claims, and the catalog
names nothing — so a claim never carries a list of documents that could rot.

| Word           | Meaning                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| **claim**      | A falsifiable statement the codebase must satisfy. Carries a stable slug.              |
| **catalog**    | Every claim a project promises **now**. `docs/catalog/`.                               |
| **witness**    | A mechanism that judges a claim. It **is** its marker.                                 |
| **marker**     | The comment block that designates a witness. Opened by `@attests`.                     |
| **subject**    | The code a witness judges. `@scope` names it.                                          |
| **instrument** | The witness itself: the marker, the lines it owns, and the claim text.                 |
| **verdict**    | What a witness says about the **subject**: affirms, denies, silent.                    |
| **standing**   | Whether one instrument supports one claim: sound, unsound, unaudited.                  |
| **coverage**   | Whether a claim's witnesses **together** uphold it: covered, under-covered, unaudited. |
| **amendment**  | The set of claim changes one unit of work proposes. `.scratch/amendments/`.            |
| **fog**        | Material you want, but cannot yet state as a claim. `.scratch/fog.md`.                 |
| **rationale**  | Why a claim reads as it does, and what was rejected. `docs/rationale/`.                |
| **grounding**  | A `@grounds` line binding a rationale to one claim it explains. Repeatable.            |
| **ruling**     | The decision a human makes at the merge.                                               |

Read these as precise terms. Reading them as ordinary English produces confident mistakes.

## Writing a claim

This is the part most often gotten wrong, and the part this project has already gotten wrong once.
Crux §5.9 and §4.1.

**Group claims by the failure a reader can see. Do not group them by the check that finds it.**

A weak generator, a `Math.random` call, and a sixteen-byte value are three defects found by three
different checks. They produce one visible failure: somebody can guess the token. That is **one**
claim — `root/token/cannot-be-guessed` — holding three witnesses.

Two properties are two claims when they can fail separately **and** a reader would see two
different things. `root/entry/one-per-local-date` and `root/entry/last-write-wins` stay apart:
duplicated rows and stale data are different failures.

Four tests, in order:

1. **Could anything plausibly violate it?** If nothing could, write a rationale and no claim.
2. **Is its state rederivable from this repository alone?** A dashboard setting, a DNS record, or
   a verified address is not. Do not claim it. Put it in `docs/runbooks/` and name the risk there.
   A `wrangler` command that runs fully local — `dev`, `--local`, `deploy --dry-run` — is still
   fine, because it reads repository configuration and asks Cloudflare nothing.
3. **Does the repository hold the value?** If not, raise the claim until it is about how the value
   is used rather than what it is. The mail domain is a secret, so the claim is _no address is
   written as a literal_.
4. **Does the claim describe its own witness?** Then it is at the wrong altitude. A claim is about
   the **subject**. `root/config/is-context-service` describes an instrument, and it should never
   have been a claim.

**The operator must be able to rule on it.** A human has an opinion about _nobody can guess the
token_. Nobody has an opinion about which context service holds the time zone.

**Slugs.** `<project>/<path>/<predicate>`, lowercase and hyphenated. The slug is stable and
survives a rewording of the prose.

The prefix names a project, and a project is whatever a `GLOSSARY.md` declares with `@project`.

**Feelsie is one project, and will not become more than one.** Core, check-in, and dashboard are
three deliverables of a single product: they answer to the same requirements and they are
described by the same words. A second project would mean a second vocabulary, and there is no
second vocabulary to hold — so no package declares `@project`, and the root
[`GLOSSARY.md`](./GLOSSARY.md) is the only one. This is a decision about this repository, not
about crux: a monorepo whose packages are separate products, crux's own included, splits
differently.

**The prefix is `root/`, and it is the only one.** `core/`, `checkin/`, `dashboard/`, and `root/`
were all written when four projects were planned;
[`.scratch/ONE-PROJECT.md`](./.scratch/ONE-PROJECT.md) collapsed them, and the operator ruled for
`root`. The old prefixes were demoted to the `<path>` segment where a subsystem belongs —
`root/checkin/form/get-does-not-write` — except `core/`, which named a package rather than a
subsystem and was dropped: `core/token/cannot-be-guessed` is now `root/token/cannot-be-guessed`.

**A package glossary holds no words.** Not now, and not when one is reintroduced for some other
reason. The words all live at the root — measure, entry, check-in, prompt, token, local date,
send hour, dashboard, streak — and one list still fits.

**So a new word goes in the root `GLOSSARY.md`**, settled before the claims that use it. Add a
package-level entry only when a word means something genuinely narrower inside that package than
it does in the repository — and say so in the entry, because two homes for one word is the failure
this rule exists to prevent.

## Choosing a witness

Push each claim as far up this list as it honestly goes. Crux §5.2.

| #   | Kind           | Verdict from         | Note                                         |
| --- | -------------- | -------------------- | -------------------------------------------- |
| 1   | type or schema | the compiler         | a violation is unrepresentable, not caught   |
| 2   | test           | the runner           | the common case                              |
| 3   | lint rule      | the linter           | the marker sits on the line declaring the id |
| 4   | witness file   | a person or an agent | prose. A target, and a judgment.             |

The ceiling is set by the ecosystem as well as by the claim. Every Effect linter rule this project
turns on is a witness for the cost of one comment on the config line. Do not write a test that
reads the config and asserts a rule is on — the marker's position already does that job.

**Naming the witness is where the design happens.** A claim recorded without one is a wish.

### One claim usually needs several witnesses

**A witness that closes one way to fail does not affirm the way to succeed.** A lint rule
forbidding `Math.random` removes one way to fail. A hand-written weak generator passes it without
complaint. The repair is a second witness of the opposite polarity — a test that watches the
production path take its bytes from the approved source.

**The repair is a witness, not a second claim.** Crux §5.8.

Check this first on any claim whose witnesses are all prohibitions.

## The marker format

A directive is `@name`, then whitespace, then **exactly one whitespace-free token**. Everything
else on the line is ignored, so the core never learns any comment syntax. Crux §6.

| Shape         | Directive         | Token                             | Opens         | Repeatable |
| ------------- | ----------------- | --------------------------------- | ------------- | ---------- |
| **noun**      | `@project` prefix | one slug segment, no `/`          | a project     | no         |
| **noun**      | `@claim` slug     | a slug                            | a declaration | no         |
| **verb**      | `@attests` slug   | a slug, or a comma-separated list | a marker      | yes        |
| **verb**      | `@grounds` slug   | a slug, or a comma-separated list | a grounding   | yes        |
| **attribute** | `@scope` globs    | a glob, or a comma-separated list | —             | yes        |
| **attribute** | `@kind` word      | `capability` or `development`     | —             | no         |

`@project` is read only in a `GLOSSARY.md`. Everywhere else the name is ordinary text.

**Extent.** A block owns from itself to its terminator, to the start of the next block, or to the
end of the file. Terminators name their opener: `@claim:end`, `@attests:end`, `@grounds:end`.
There is no bare `@end`. Reach for a terminator inside a configuration map, where the default
extent is too wide:

```jsonc
{
  "rules": {
    /* @attests root/token/cannot-be-guessed */
    "no-restricted-properties": "error",
    /* @attests:end */
  },
}
```

**Markdown.** Any construct that leaves the trailing token intact. **Use the blockquote** — it
renders as a visible band, where an HTML comment renders as nothing and hides the slug you cite in
pull requests.

```md
> @claim root/token/cannot-be-guessed
> @kind capability

Nobody can guess a token.
```

Two traps. A backtick code span **silently fails to scan**, because the closing backtick joins the
token. A token containing `<`, `>`, or a backtick is not a directive at all — which is what lets
this file write `@claim` in a table without declaring anything.

## Form errors

A machine finds all of these with no intelligence. Crux §6.6. Crux resolves slugs and never
resolves paths, so file positions here are house rules.

**unattested** — a claim no marker names · **orphaned** — a marker naming no existing claim ·
**dead scope** — a `@scope` matching no file · **mixed** — one block with two openers ·
**misplaced** — an attribute its opener does not take · **unknown kind** — a `@kind` in a
declaration outside the two words · **misfiled** — a slug prefix naming no declared project ·
**forward dangle** — a `@grounds` naming a claim that is not declared.

A rationale grounding a **deleted** claim is reported and is not an error. The document was true
when it was written.

## The amendment

An amendment is the set of claim changes one unit of work proposes. Operations are **add**,
**change**, and **delete**. An add also names the witness that will attest the claim. It lives in
`.scratch/amendments/` until there is a branch, and the merge enacts it.

**An amendment is a specification, not a freeze.** Writing a witness routinely shows that a claim
does not say what it means. When it does:

> **State the proposed change and stop. Ask the operator. Do not change the specification on your
> own authority, and do not implement a claim you know is wrong.**

That escalation is a first-class step, not an escape hatch. A001 used it three times and every use
improved the result. Crux §7 and §9.1.

## Finishing the work

**A green test run is a handoff, not doneness.** The first build of `core` passed every test and
passed `vp run ready`, and an independent audit then marked six claims red. The tests asserted the
ordinary path; the claims promised the edges. Crux §9.2.

So the gate is applied by somebody who did not build. When you audit, **work claim by claim**:

1. Collect every witness of one claim.
2. For each, set a **standing** — does this instrument support this claim? A witness that supports
   part of a claim is sound. A witness that is irrelevant to it is unsound.
3. Read the whole set together and set the **coverage** — do these witnesses reach the whole
   claim?

**Every witness sound does not mean the claim is covered.** That is the reason coverage is a
separate question. Under-coverage has two repairs: add a witness, or lower the claim.

Marker order is the wrong order. Coverage is invisible from it.

Adversarial cases are where a builder's tests fall short. Force the named mechanism, hit the exact
boundary from both sides, prove the refusal had no side effect, and cover every constrained value.

## Where a piece of writing goes

Nothing lives in two homes.

| It is                                       | It goes to                  |
| ------------------------------------------- | --------------------------- |
| a promise something could plausibly violate | a claim in `docs/catalog/`  |
| a decision nothing could violate            | `docs/rationale/`, no claim |
| wanted, but not yet statable as a claim     | `.scratch/fog.md`           |
| statable, and proposed as work              | `.scratch/amendments/`      |
| a manual setup step outside the repository  | `docs/runbooks/`            |

**Fog is inability, not unwillingness.** A claim you could write but have not written is an
unwritten amendment, not fog. _Not now_ produces no artifact at all.

**A fog item records what would clear it**, and the useful cut is _can this be answered from the
checkout, or must the world be asked_. That is what sorts the queue; one grep and one deployment
look identical without it.

**A rationale earns its file** only when the decision is hard to reverse, surprising without the
reasoning, and the result of a real trade-off. It names what was rejected — the half the code
cannot show. `@grounds` must name a **declared** claim, so a rationale and its claim land in one
merge. Cite only the claims that exist; a later amendment adds its own `@grounds` line.

## The dogfooding duty

No tooling implements crux yet, so every artifact here is maintained by hand. That friction is the
data this project exists to produce.

> **When the framework strains, say so in your report and record it in
> [`.scratch/CRUX-FEEDBACK.md`](./.scratch/CRUX-FEEDBACK.md). Working around it silently destroys
> the only output that matters.**

Sort what you noticed into one of two columns, and put the running account in
[`.scratch/FOG-LOG.md`](./.scratch/FOG-LOG.md):

- **clerical** — transcription, repeated cross-references, anything a tool could absorb. A missing
  feature.
- **thinking** — judgment. Never automate it. Two entries are settled: _claim, or settled by
  construction?_ and _is this claim covered?_

Watch for these specifically:

| Watch for                                             | What it tells you                     |
| ----------------------------------------------------- | ------------------------------------- |
| a claim you could not write, and what unblocked it    | where the fog boundary falls          |
| a claim reworded after its witness was written        | the right granularity                 |
| an amendment that had to change during the build      | where the entry gate belongs          |
| what you had to re-derive at the start of the session | what the tracker must hold            |
| **a catalog that was tiring to read**                 | the altitude is wrong, claim by claim |
| the same fact edited in more than one file            | a cross-reference no tool owns        |

The fifth row is the one that corrected crux itself. Every claim in `core` was defensible alone,
and the catalog as a whole was not. A complaint about the reading is evidence about the design,
and it names no single defect — which is exactly why it is easy to swallow instead of report.

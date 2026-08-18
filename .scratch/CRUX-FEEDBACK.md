# Crux and cairn — findings to port

Feelsie is the first project built under the crux vocabulary that is not crux itself. This file
is the queue of what that turned up, written so it can be lifted into crux's `ABSTRACT.md`
without re-deriving the context.

[`FOG-LOG.md`](./FOG-LOG.md) is the chronological diary and refers to these by number. This file
is the authoritative statement of each one.

**Status** is `settled` (decided here, port it), `repeated` (seen more than once, so it is
evidence rather than anecdote), `open` (recorded, no decision), `watch` (one occurrence — needs a
repeat before it means anything), or `retracted` (was wrong; kept because the correction is the
finding).

Entries are in the order they were found, not in numerical order. The index is the queue.

| #   | Finding                                                     | Status     | Destination      |
| --- | ----------------------------------------------------------- | ---------- | ---------------- |
| C1  | a claim's subject must be rederivable from the repository   | `settled`  | crux §5          |
| C2  | a rationale ships with the claims it grounds                | `settled`  | crux §11.5, §6.6 |
| C3  | the witness assignment is where the design happens          | `open`     | cairn            |
| C4  | cairn owns the cross-references                             | `repeated` | cairn            |
| C5  | an amendment has nowhere to live before there is a branch   | `settled`  | cairn            |
| C6  | fog in the target repository pollutes product history       | `settled`  | cairn            |
| C7  | an exit gate does work an open-questions list cannot        | `settled`  | evidence for §10 |
| C8  | "claim, or settled by construction?" has no mechanical form | `settled`  | never automate   |
| C9  | one prose sentence, two claims, two projects                | `watch`    | —                |
| C10 | claim boundaries follow reader-visible failures             | `settled`  | crux §5.9        |
| C11 | the root project holds development claims or none           | `watch`    | —                |
| C12 | the root project is named `root`                            | `settled`  | crux §3.4, §2.2  |
| C13 | fog can clear without producing anything                    | `watch`    | —                |
| C14 | a value held outside the repository raises its claim        | `settled`  | crux §5          |
| C15 | a third-party type-aware linter is a witness supply         | `settled`  | crux §5.2, §6.3  |
| C16 | a fog item must record what would clear it                  | `repeated` | cairn            |
| C17 | markdown directives are invisible in rendered views         | `settled`  | crux §6.3        |
| C18 | directive names collide with other ecosystems               | `settled`  | crux §6.1, §6.6  |
| C19 | audit coverage before an amendment freezes witness work     | `repeated` | crux §7, §9.2    |
| C20 | §4.1's boundary is set by tooling, not by principle         | `settled`  | crux §4.1, §5.2  |
| C21 | no artifact exists for work that changes the witness supply | `repeated` | crux §7, §13     |
| C22 | an amendment has no vintage                                 | `watch`    | —                |

---

## C1 — A claim's subject must be rederivable from the repository · `settled`

> **Refined by [C20](#c20--41s-boundary-is-set-by-tooling-not-by-principle--settled), not
> retracted.** The rule holds. What C20 adds is that the boundary it draws moves with your tooling:
> a claim about _live_ infrastructure still does not belong in the catalog, and a claim about
> _declared_ infrastructure does. All three claims deleted below are rewritten in A006.

**Where it came from.** Feelsie's highest-stakes promises were about a Cloudflare account: the
apex MX records, an Access application on the dashboard hostname, a rate-limit rule. All are
falsifiable, all are plausibly violable, and the failure of any of them is worse than any bug in
the code — a wrong MX record stops your personal mail, a missing Access application publishes
every entry.

They were drafted as four claims witnessed by witness files running `dig` and `wrangler`, and
the draft did not survive contact with §5.5. A verdict is carried when nothing inside `@scope`
changes, and no pull request touches a Cloudflare setting — so the witness goes green after its
first audit and stays green no matter what is true. Removing `@scope` makes it silent on every
canvass instead, which is honest and puts a permanent yellow row in front of the operator at
every ruling, which is how an operator learns to wave yellow through.

**The ruling.** Neither. The claims do not get to exist.

> **Crux judges the repository. A claim whose state is not rederivable from the repository alone
> is not a claim.** Reality drifting from the repository is infrastructure monitoring, which is a
> different problem with a different shape — it is scheduled, not diff-triggered, and it has no
> pull request to attach to.

**The corollary, and it is not a loophole.** A `wrangler` command _is_ an acceptable witness
when it runs fully locally — `wrangler dev`, `--local`, `deploy --dry-run`. Those read repo
configuration and ask Cloudflare nothing, so their answer is rederivable from a checkout.

**Why the rule has teeth.** It is not a restatement of "witness what you can". Applied to
feelsie it deleted four claims and cut a fifth in half, mid-sentence: of "the sending address is
on the onboarded subdomain, and the recipient is a **verified** destination address", the first
clause survived because `wrangler.jsonc` is in the repository, and the second did not because
verification happened in a dashboard.

That surviving clause was then rewritten again by C14, and the claim is now
`checkin/email/addresses-are-never-literal`. Two rules, two rewrites, and the end state is
stronger than any draft — see the trail preserved in
[`amendments/002`](./amendments/002-the-checkin-worker.md).

**To port.** A rule in §5, and it closes the out-of-repo case that §5.5 and §8.5 both silently
assume away. Both rest on _the repository is the only thing that changes between merges_; this
states that assumption as a requirement instead of leaving it implicit.

## C2 — A rationale ships with the claims it grounds · `settled`

Crux covers a rationale grounding a **deleted** claim: reported, not a form error, because the
document is still true. It says nothing about grounding one that has not been written yet, and
the orphan check does not reach it, because a grounding is not a marker.

Feelsie produced six rationales before a single line of code, and every `@grounds` in them
dangled forward.

**The first ruling was that this is legal and reported, like the deleted case. That was wrong**,
and the reason it was wrong is the useful part. A rationale explains why a claim _reads as it
does_. If the claim does not exist, the document is explaining a decision nobody has enacted —
which is intent, and intent is the amendment's job. A rationale committed ahead of its claim is
doing the amendment's work in the wrong artifact.

**The ruling.** `@grounds` must resolve. A grounding naming no declared claim is a form error, in
the same family as an orphaned marker.

The mechanism needs nothing new. A claim is _declared_ by `@claim` on the branch; §4's condition
— a sound witness affirms it — is enforced at the merge, not at declaration. So claim, witness,
and rationale are authored on one branch and land in one merge, and `@grounds` resolves against
declared slugs the whole time.

### The asymmetry, and the principle under it

- **forward dangle** — the claim is not declared → **form error**
- **backward dangle** — the claim was later deleted → **reported, not an error** (§11.5 stands)

These differ for a reason worth stating generally:

> **A form error must be fixable by the person who caused it, at the moment they caused it.**

The forward case is preventable while writing. The backward case is created by a later merge that
cannot reach back into a document that was true when written.

### The multi-amendment case, and how it resolves

A rationale often grounds claims that land in different merges. Feelsie has one:
`the-cron-runs-every-hour.md` grounds a `core` claim and a `checkin` claim, split by a **layer
boundary** rather than by topic — the reasoning is one thought and the packages are two. Most
architectural decisions look like this.

Two rules were considered. _Ship the rationale with the last claim it grounds_ keeps the check
strict and hides the document during the window when some of its claims are already live — which
is exactly when a reader goes looking.

**The adopted rule is the inverse:** write the rationale as soon as any claim needs it, and cite
only the claims that exist. A later amendment adds its own `@grounds` line to the existing
document. Nothing ever dangles, the check stays strict, and the reasoning is available from the
first merge.

It has a second-order benefit nobody was aiming at: **a rationale's `@grounds` list grows over
time, and the growth is a signal.** A document that accumulates grounds is one whose decision
turned out to be load-bearing across the system — information that writing the list upfront
destroys.

### The failure it accepts, stated plainly

The later amendment writer may not find the earlier rationale, and then it under-grounds: it is
about claim B, does not cite it, and "why is B the way it is?" returns nothing when an answer
exists.

**This is uncheckable by construction.** §11.1 already says a machine cannot tell _this document
is about that claim_ from _this document mentions it_ — that is why `@grounds` exists. No form
check reaches it and no audit reaches it, because a rationale is not an instrument.

It is survivable because §11.3 already accepts that some rationales are found by reading the
directory rather than by index, so under-grounding degrades to a baseline crux tolerates rather
than to nothing. The case to watch is the layer-boundary one above, since that is where
correlated claims reliably land in different merges.

**To port.** §11.5 gains the forward case as an error and keeps the backward case as a report;
§6.6 gains a form error for a grounding that names no declared claim.

## C3 — The witness assignment is where the design happens · `open` (for cairn)

Not the claim text. Assigning the witness changed the design three times in one session, and
each time the claim as written would have shipped something worse:

| Claim                    | As written              | After assigning a witness                                                                 |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `dashboard/never-writes` | a sentence about intent | a decision about who constructs the database handle — a type with no write method, kind 1 |
| `core/token/is-random`   | trivially statable      | untestable as stated; needs a lint rule banning `Math.random` to be real at all           |
| `backup/lands-in-r2`     | one claim               | two witnesses answering different questions; either alone is misleading                   |

**For cairn.** A tracker that accepts a claim without a witness is recording wishes. The witness
field is not metadata to fill in later — it is the step that finishes the claim, and §10's exit
gate already says so ("write the claim **and** assign its witness"). The tracker should enforce
what the gate already states.

## C4 — Cairn owns the cross-references, because nothing else does · `repeated` — for cairn

Three symptoms, one cause: **every cross-reference in this tracker is maintained by grep and
hope.**

**The project list must exist before the first slug can be written.** A slug prefix names a
project and a prefix naming no project is misfiled, so authoring the very first claim required
inventing the package layout (`packages/core`, `apps/checkin`, `apps/dashboard`). That was fog,
and it blocked every other item in the tracker until it was guessed at.

**Nothing checks a slug while the claim does not exist.** Six rationale files reference eight
slugs that live only in the tracker, and the correspondence between what a rationale grounds and
what an amendment proposes is maintained by grep and hope.

**C2 closes this one, and it is the only one it closes.** Requiring `@grounds` to resolve to a
declared claim means the rationale and the claim land together, so the window in which a slug
lives in two unsynchronised places disappears. That leaves the other two instances untouched,
which is the useful signal: the remaining duplication is between the tracker and the repository,
and no rule inside the format can reach it.

**A cleared fog item leaves stale gates behind, and this one shipped.** F11 was cleared and A001
unblocked, and `amendments/README.md` was left saying A001 was gated by F11 — in two places. It
was committed that way and found by a grep afterwards. Nothing failed, nothing warned, and the
tracker's own index disagreed with the amendment it indexed.

That is the third instance and it is what moves this from `open` to `repeated`. All three have
the same shape: a fact recorded in two files, no tool that knows they are the same fact.

| Instance                                  | The duplicated fact   | Found by                  |
| ----------------------------------------- | --------------------- | ------------------------- |
| a slug in a rationale and in an amendment | the claim's name      | a hand-written shell loop |
| a project prefix and the package list     | which projects exist  | inventing F8 to proceed   |
| a gate in an amendment and in its index   | which fog blocks what | a grep, after committing  |

F13 produced a fourth instance. The proposed home for Effect rule severities was repeated in the
fog item, F11's ruling, a rationale, and C15 before the experiment checked it. Current Effect
documentation puts Oxlint severities in `vite.config.ts`, not `tsconfig.json`. Correcting that
one fact required four manual edits. This strengthens the existing ruling and adds no new one.

**For cairn.** The requirement is not a schema. It is that **the tracker holds each fact once and
derives every view** — the sequence table, the gate column, the per-amendment header — rather
than storing them alongside each other. Crux already works this way and says so: the marker index
is derived on every run and stored nowhere, and a witness needs no stable identity because every
question about it is answered by a diff. A tracker that stores a gate in two places has taken on
a consistency problem crux deliberately does not have.

Cairn is also the only artifact present at the moment a slug is first written, so it is the only
thing that could own the namespace either.

## C5 — An authorable amendment has nowhere to live before there is a branch · `settled`

An amendment is held by the branch and enacted by the merge. Feelsie has four authorable
amendments and no branch, so they sit in `.scratch/`. The answer to _where does the amendment
live_ cannot be "a file on the branch" alone, because amendments exist, and are worth ordering
against each other, before any work starts.

**Resolved together with C6: cairn holds its own state, outside the target repository.**

## C6 — Fog in the target repository pollutes product history · `settled`

`.scratch/` is committed, so every clarification of a fog item is a commit in feelsie, interleaved
with commits that change the product. Observed rather than predicted, and it is the argument for
a second store keyed to the target.

### What C5 and C6 settle jointly

**Cairn keeps its state outside the repository it serves.** §12 already made this possible on
purpose: _a tracker stores slugs and never claim text_, and whoever has the checkout resolves the
slug. That is not a concession to an external tracker — it is the interface designed for one.

**And the bill comes due immediately.** When fog lived in `.scratch/`, a slug rename was atomic
with the code that caused it. Moving the tracker out breaks that atomicity, and C4's stale
references get worse rather than better: the dangling reference now lives in a different system,
on a different release cycle, that cannot see the rename happen.

**So cairn needs a watcher, and it is a repair rather than a feature.** It checks out the target
at `main`, runs crux, and warns about stale references in its own tickets and fog.

Three constraints fall out:

- **It holds no facts.** Re-derive from HEAD every run, like §9.3's supervisor. Kill it and
  restart it and nothing is lost.
- **It consumes what crux already emits.** §13.1's machine-form marker index. The interface is a
  file, not an API, and crux learns nothing about cairn.
- **The warnings point one way only.** Cairn warns about cairn's references, never about the
  repository. The repository is authoritative. A watcher reporting _into_ the repository would
  quietly create the dependency §12's one hard line forbids.

**The symmetry is worth naming out loud.** C1 ruled that reality drifting from the repository is
_monitoring, not review_ — scheduled rather than diff-triggered, with no pull request to attach a
verdict to — and pushed it out of crux. The watcher is monitoring, for tracker drift from the
repository. Same shape, different subject, excluded from crux for the identical reason, and
landing in cairn because cairn is the thing that can be wrong.

## C7 — A fog item's exit gate does work an open-questions list cannot · `settled`

`ABSTRACT.md` §15 listed the free-text note field as an open decision that "does not block the
first build". Rewriting it as a fog item forced the question _what does this block_, and the
answer was the first migration — the column is in it or it is not, and adding it later is a
migration against the only copy of the data.

The contradiction was in the source document and nobody had noticed. It surfaced in the act of
writing the gate, not on reflection afterwards.

**To port.** Nothing normative; §10 is already right. This is the evidence that it is.

## C8 — "Claim, or settled by construction?" has no mechanical form · `settled`

The highest-value question in the session, and it went the counter-intuitive way twice. "Use two
Workers, not one" reads like a claim and is not — nothing drifts into one Worker by accident.
"The dashboard reads data only" reads like documentation and is the most important claim in the
project.

Getting these backwards produces a catalog of unfalsifiable statements that costs audit time
forever, while missing the one property worth protecting. Confirms §11.3 and property 15, and
belongs permanently in the _never automate_ column.

## C9 — One prose sentence, two claims, two projects · `watch`

`ABSTRACT.md`: "the token gives no access to the history." That became
`core/token/authorises-one-date` and `checkin/exposes-no-history` — different projects, different
altitudes, neither implying the other, and no honest single witness spanning both.

A granularity signal. One occurrence; needs a repeat before it says anything about where the
right altitude is.

## C10 — Claim boundaries follow reader-visible failures · `settled`

**The original finding and its first correction were wrong.** The original said that one claim
can need two witnesses. The first correction said that different witness kinds require separate
claims.

Both versions used instruments to set the claim boundary. That rule split one token promise into
three checks. It also promoted a configuration type witness into a claim.

**The ruling.** Group claims by the failure a reader can see. Do not group them by the check that
finds the failure.

A weak generator, a `Math.random` call, and a short token produce one visible failure. Somebody
can guess the token. An absent time zone and an unknown time zone also share a visible outcome.
The system records the wrong local date, or it does not start.

Coverage makes these claims legal. A witness can support part of a claim and remain sound. The
auditor separately judges whether all witnesses reach the claim.

A005 repairs the catalog that exposed the error. It replaces six check-level claims with two
reader-visible claims. Crux §5.8 and §5.9 now record the resulting rules.

## C11 — The root project may hold no claims at all · `watch`

§3.4 names the repository root as a project when it holds claims of its own. After C1 removed
the infrastructure claims, feelsie has none — every claim belongs to `core`, `checkin`, or
`dashboard`. The root's plausible claims are all development-kind (conventional commits, the
lint rules, the gate), and this project has deferred them (F11).

Not a defect. Worth knowing that an application repository may reach a working catalog without
ever using the prefix, where a tool monorepo like crux's own uses it immediately.

**Confirmed by the author: root claims are expected to be mostly development-kind.** One nuance
that survives — it is a correlation, not an identity. A package holds development claims too
(`core` will have its own lint rules), so `@kind` stays non-derivable from the slug prefix and
earns its place as a directive.

**The counter-example arrived, and it came from the direction this entry left open.** A006's
`root/dns/apex-mail-is-declared` is `@kind capability`, at the root, because the zone belongs to no
package: both hostnames live in it and the apex records concern mail unrelated to this project. So
the first root claim to be written is the exception rather than the predicted rule.

That strengthens rather than weakens the nuance above. The correlation is real — the root's _other_
plausible claims are still all development-kind — and it is now demonstrated in both directions,
which is what a directive rather than a convention buys.

## C12 — The root project is named `root`, not `workspace` · `settled` (against crux)

§3.4 chose `workspace` over `root` on the grounds that the document already uses _root_ to mean
a position rather than a thing. Feelsie's author — who is also crux's — preferred `root` on
first contact with the name, so this project uses `root/`.

**The objection was put to the author and dismissed on the merits**: "the repository root" and
"the root project" read as the same thing, and the thing does not need disambiguating from the
position. That is a defensible reading — the root project _is_ the project at the root, so the
overload is a description rather than a pun.

The interesting part is not which word wins. It is that the first consumer of the vocabulary
rejected a settled naming decision on sight, and then rejected the argument for it a second time
when it was restated. §2.2 exists precisely so that rejected words are not re-proposed, which
makes the follow-through mechanical: **if crux adopts `root`, `workspace` goes into §2.2 with
§3.4's argument attached.** Deleting the reasoning would leave the next person free to propose
`workspace` again, which is the exact failure §2.2 was built to prevent.

## C13 — Fog can clear without producing anything · `watch`

§10 gives fog two exits: write the claim and assign its witness, or discharge into a rationale.
Feelsie found a third. F6 asked whether the confirmation page shows a chart of the last seven
days; the answer was no — and no artifact resulted, because `checkin/exposes-no-history` already
forbids the alternative. A route returning seven entries violates a claim that was written for
an unrelated reason.

So the item was fog by the definition (the claim could not be written), and clearing it added
nothing to the catalog, the rationale directory, or the tracker. It simply stopped being open.

Worth watching whether this is common. If it is, a tracker needs a disposition for _answered,
already covered_ that does not look like an abandoned item — and the fact that an existing claim
answered it is a small piece of evidence that the claim was written at the right altitude.

**Put to the author, who declined to model it**, and that is the right call twice over. §11.2's
three tests reject writing a rationale for the refusal — it is cheap to reverse, nobody would be
surprised, and no alternative was examined — so declining generates nothing, correctly.

And note what crux does with "not now": **nothing.** It is not fog, because §10 is explicit that
inability rather than unwillingness is the test, and admitting unwillingness is precisely how fog
degrades into a backlog. It is not an amendment. It is not a rationale. A framework that produced
a ticket here would be worse; the absence of an artifact is the feature.

## C16 — A fog item must record what would clear it · `repeated` — for cairn

**This is the first pain point in the log to occur twice, which by the dogfooding rule makes it
evidence rather than an anecdote. It is the input to cairn's design.**

§10 gives fog two exits, judgment and evidence, and treats "evidence" as one thing. Feelsie found
the cost of evidence varies by orders of magnitude, and the tracker had nowhere to say so.

| Item | Posed as                                           | Actually cleared by                             | Cost                     |
| ---- | -------------------------------------------------- | ----------------------------------------------- | ------------------------ |
| F1   | "does `send_email` work in a `scheduled` handler?" | deploying a throwaway Worker                    | hours, still open        |
| F2   | "can a subdomain be onboarded safely?"             | a rehearsal on a spare domain                   | an afternoon, still open |
| F11  | a judgment about tooling                           | reading two repositories, then a human decision | two fetches              |
| F12  | "run an experiment"                                | one grep of `pnpm-lock.yaml`                    | seconds                  |

F11 and F12 are the repeat. In both, the item was written as though clearing it required work,
and in both the fact that made it decidable was already available — sitting in a lockfile, or one
fetch away. Nothing in the tracker had a field for it, so in both cases the cheapness was
discovered rather than planned.

**What cairn should hold.** A fog item needs a _what would clear this_ field, and it is not
documentation — it is the field that makes the queue sortable. Without it, an item answerable in
one grep and an item requiring a deployment look identical, and the human picks by guessing.

**And the exit taxonomy should split.** _Judgment_ / _evidence_ is the wrong cut, because F11 was
both: an agent gathered the facts, a human made the call. The cut that predicted cost here was
**can this be answered from the repository, or must the world be asked** — which is C1's
distinction, arriving a second time from an unrelated direction.

That coincidence is worth taking seriously. The same line — inside the checkout or outside it —
decides whether a claim can exist (C1), whether a claim must be raised a level (C14), and now how
expensive a fog item is to clear. Three unrelated problems, one boundary. If crux has a single
load-bearing distinction, this is a strong candidate.

## C15 — A third-party type-aware linter is a witness supply · `settled`

§8.3 says a lint witness need not be a custom rule: the handle is the rule id, and the marker's
home is wherever that id is declared — including the config line that turns a built-in rule on.
That paragraph reads like a convenience. Feelsie found it is a supply line.

The Effect team ships a type-aware linter with roughly eighty rules across correctness,
anti-pattern, effect-native, and style categories, and it **emits them as Oxlint type-aware
rules**. Belay already plans an Oxlint adapter. So the chain closes with nothing built:

> rule id in `vite.config.ts` → marker on that line → Oxlint report → existing adapter → verdict

Every rule the project enables is a development claim with a working witness, at the cost of one
comment. No custom rule, no adapter, and — per §8.3's explicit warning — no test that reads the
config to assert the rule is on.

**Two things this sharpens.**

**The witness ladder has a supply side, and crux does not mention it.** §5.2 tells you to push a
claim as far up the ladder as it honestly goes, and reads as though the ceiling is set by the
claim. It is also set by what your ecosystem hands you. Adopting a library that ships lint rules
raises the ceiling for every claim in the project at once, and that is a reason to choose a
library that has nothing to do with the library's runtime behaviour. Feelsie chose Effect partly
on this basis.

**The experiment corrected the marker home.** Early research put Effect rule severities in
`tsconfig.json`. F13 showed that Oxlint severities live in `vite.config.ts`, which accepts normal
comments. JSONC remains relevant to `wrangler.jsonc`, but Effect no longer supplies evidence for
that part of §6.3.

F13 also confirmed the main finding. `effecttsgo/floating-effect` denied a deliberate violation
through `vp lint`, with the same report format and exit status as other Oxlint rules.

## C14 — A value held outside the repository pushes its claim up one level · `settled`

A generalisation of C1, and it arrived by a different route. Feelsie is a public repository, so
the domain is configuration rather than a literal — it never appears in a checkout.

That kills the claim as first written. "The sender address is on the mail subdomain" is not
rederivable when the subdomain is a secret. What survives is a claim one level more abstract:

> No address is written as a literal. Every address the Worker sends from is constructed from
> the configured mail domain.

The value is unavailable, so the claim becomes about the **mechanism** that consumes the value.
And the abstract version is the better claim: it is violated by a hardcoded address anywhere in
the Worker, which is the failure that would actually happen, where the concrete version only
ever checked one string.

**The rule.** When a claim's subject depends on a value the repository does not hold, do not
delete the claim — raise it until it is about how the value is used rather than what it is. C1
deletes a claim whose _state_ lives outside; this rewrites a claim whose _data_ does. The two
are easy to confuse and they have opposite remedies.

## C17 — Markdown directives are invisible in every rendered view · `settled`

§6.3 says Markdown uses the same rule "in an HTML comment. Not frontmatter." The rejection of
frontmatter is sound — the core would learn a second format and a rule for when to apply which.
But the _choice of HTML comment_ was never weighed against visible alternatives, and it has a
cost §6.3 does not mention.

**An HTML comment renders as nothing.** In GitHub, in an editor preview, in any docs site, the
directives are gone. For a rationale that is mildly annoying. For the catalog it is worse: the
slug is the identifier you cite in a pull request, a ticket, and a conversation, and the artifact
humans read most is the one that hides its own identifiers.

Found by reading feelsie's own rationale files in a Markdown viewer and seeing no `@grounds` at
all.

**§6.1 already permits the fix**, because it tolerates leading noise — that is how
`* @attests foo/bar` works inside a JSDoc block. Only _trailing_ junk breaks a directive,
since the token is whitespace-delimited.

| Form                       | Renders as        | Scans?                                   |
| -------------------------- | ----------------- | ---------------------------------------- |
| `<!-- @claim foo/bar -->`  | **nothing**       | yes `crux-ignore`                        |
| `` `@claim foo/bar` ``     | code span         | **no** — the token becomes ``foo/bar` `` |
| `## @claim foo/bar`        | heading, anchored | yes, but fights `@kind` (see below)      |
| `> @claim foo/bar`         | blockquote        | yes                                      |
| a ` ```crux ` fenced block | code block        | yes                                      |

The inline-code form is the trap: it looks like the obvious answer and silently corrupts the
token, because no whitespace precedes the closing backtick.

The heading form is tempting — every claim would get a TOC entry and an anchor to link at — but
a block is a contiguous run of directive lines, and Markdown wants a blank line after a heading,
which terminates the block. `@kind` would have to sit immediately under the heading with no blank
line, rendering as a stray paragraph.

**Recommended: the blockquote.** It carries multi-directive blocks, renders as a visually
distinct band that reads as metadata, and needs no change to crux at all. The cost is the
per-claim anchor, which is cheaper than the alternative — duplicating the slug into a heading is
C4 all over again.

**To port.** §6.3 should say that a Markdown marker may use any construct leaving the directive
line's trailing token intact, and should note the invisibility cost of the HTML comment. The
one-token rule is what makes this a free choice for each repository rather than a format change.

## C18 — Directive names collide with other ecosystems · `settled`

Crux is a line scanner that never learns comment syntax, so it matches `@name` + whitespace +
token wherever it appears. That is the property that keeps the core small, and it means the six
directive names are shared with every other tool that had the same idea.

**The one-token rule immunises most of what looks dangerous.** Anything where the next character
is not whitespace cannot match: `@scope/package` in an import, `` `@grounds` `` in prose,
`@Claim("groups")` in MicroProfile JWT.

**The real collisions are where a lookalike is genuinely followed by a space:**

| Directive  | Collides with                            | Real?                       |
| ---------- | ---------------------------------------- | --------------------------- |
| `@kind`    | JSDoc `@kind class`                      | documented tag, in the wild |
| `@scope`   | CSS `@scope (.card) { … }`               | shipped at-rule             |
| `@end`     | Objective-C `@end`, Texinfo `@end table` | language keyword            |
| `@claim`   | prose documenting crux                   | see below                   |
| `@attests` | nothing found                            | —                           |
| `@grounds` | nothing found                            | —                           |

**The pattern is the finding.** The four ordinary English words all collide and the two unusual
ones are clean. `@attests` and `@grounds` are safe precisely because nobody else reaches for
them. That extends §2.1's naming rule into a domain it was not written for: **an unusual word is
collision-resistant, and a common one is a shared namespace with every tool that named the same
concept.**

### Three of the four fail safe. One does not.

`@kind` and `@scope` are attributes, and an attribute only means anything inside a block — so a
CSS file with no opener is inert. **That is the intended reading and the spec does not say it.**
§6.6 lists "a `@kind` outside `capability` and `development` is unknown" without scoping the
check to blocks, and a naive implementation would fire on every JSDoc `@kind class` in the
repository.

A spurious `@claim` produces a claim nothing attests → unattested → red. Loud, and fixed by
rewording.

**`@end` is the unsafe one.** §6.2 is explicit that under-extension is the single failure that
lets a false witness survive, and a stray `@end` truncates a real marker's extent early and
silently. It is also the least-used directive, so a broken extent is the least likely to be
noticed.

### The three fixes

**1. Suffix the terminator with the opener it closes.** `@end` stops being a directive; the
closers become `@claim:end`, `@attests:end`, `@grounds:end`. This kills the Objective-C and
Texinfo collisions outright, and the closer becomes checkable against the opener that is actually
open.

Three notes. Spell them with the _opener tokens_, not construct names — `@witness:end` and
`@rationale:end` would reintroduce two words §2.2 deliberately killed. Two of the three are
vacuous (a grounding's extent is inert, and a catalog file is sequential prose where the default
extent is already right), so `@attests:end` is the only one that does work; allow all three
anyway for regularity. And the real implementation cost is the tokenizer: matching the name as
`@(\w+)` would parse `@claim:end` as `@claim` with the token `:end`, so the name pattern must
admit a colon. That is the one place the format has no give, so it should be deliberate.

**2. An attribute its opener does not take is a form error.** Closes the reachable edge where a
JSDoc `@kind` sits contiguous with a real `@attests` block — currently unspecified, since `@kind`
is not an opener so the block is not _mixed_. One line, and it makes the case loud instead of
silently doing something.

**3. A token containing `<`, `>`, or a backtick is not a directive.** This is the fix for prose,
and the population is larger than it looks: it is not only crux's own spec, it is **every
adopting repository's `AGENTS.md`**, because explaining the format to your agents means writing
`@claim <slug>` somewhere. Day one, every adopter.

Keep the character set narrow on purpose. A broader "any invalid slug charset is ignored" would
swallow a typo'd real slug — a stray capital, say — and that is under-detection, the one
direction §8.2 forbids. `<`, `>`, and backtick never appear in a typo of a real slug, so the
narrow rule has no false-negative surface at all.

**Crux's own `ABSTRACT.md` needs this today.** §6.1's directive table contains the cell
`` `@claim <slug>` ``, which scans as a declaration with the slug `` <slug>` `` and reports as
misfiled. The document defining the format currently fails it.

**To port.** §6.1 gains the colon in the name pattern and the `<`/`>`/backtick exclusion; §6.2
replaces `@end` with the three suffixed closers; §6.6 gains the attribute-mismatch error.

## C19 — Audit coverage before an amendment freezes witness work · `watch`

**Where it came from.** A005 combined six claims into two and kept the existing witnesses. The
amendment knew that both combined claims needed new coverage judgments.

It still scheduled the coverage audit after the gate. It also stated that any test edit proved
the diagnosis wrong. The first independent audit found that send hour `24` passed every witness.
The operator then revised the amendment and permitted witness repairs.

A second audit found two integration gaps. One test observed secure generation but not the stored
token. Two tests observed strict decoding but not the production layer. Both sets needed
production-path observations before they supported coverage.

**The friction.** Repository edits happened before the new judgment that constrained them. The
edits were reversible, but two audit rounds caused rework and interrupted the implementation.

**The observation.** If an amendment regroups existing witnesses, audit each new set before the
amendment freezes its work shape. This moves a required judgment earlier. It does not automate
coverage.

**The second occurrence, from the other side.** Reviewing A002 and A003 against §5.8 and §5.9 was
the same judgment taken at amendment time rather than after the gate, and it cost nothing to take.
Every add gained a witness set and a coverage argument before any witness was written, and three
gaps surfaced there that would otherwise have surfaced in an audit: an all-prohibition set on
`checkin/form/get-does-not-write`, a route-enumeration witness that observed which routes exist
where the claim was about what they return, and a shared marker that was the sole proof of two
claims (§5.7).

So the prescription holds and the cost is asymmetric: taken early it is a paragraph, taken late it
is rework. That is now two occurrences and the finding is evidence rather than anecdote.

**One thing this second pass found that coverage has no question for.**
`checkin/prompt/one-per-local-date` promised that the handler "creates at most one prompt" while its
named witness asserted "exactly one prompt exists **and** exactly one send occurred." The witness
reached **further** than the claim. Coverage asks whether the witnesses reach the claim and there is
no question pointing the other way, so an over-reaching witness is invisible to the audit and shows
up only when somebody reads the pair. Worth a sentence in §5.8: the reverse mismatch is a signal the
claim is under-stated, not that the witness is wrong.

## C20 — §4.1's boundary is set by tooling, not by principle · `settled`

**Where it came from.** [C1](#c1--a-claims-subject-must-be-rederivable-from-the-repository--settled)
deleted three claims — the apex MX records, the Access application on the dashboard hostname, the
rate-limit rule — because their state was not rederivable from a checkout. Adopting an Effect-native
IaC framework gave each of the three a resource declaration inside the repository, and
[`amendments/006-the-declared-infrastructure.md`](./amendments/006-the-declared-infrastructure.md)
rewrites all three as claims.

**C1 is not retracted.** The rule is right. What is wrong is that it presents its boundary as given:

> ~~This line does more work than any other line in the document. Inside the checkout or outside it
> decides whether a claim can exist…~~

The line does do that work. It is also **a function of your tooling**, and adopting IaC moves it.
F10 answered its question correctly for the tooling of the day and recorded the answer as a
principle.

**The distinction that resolves it.** A claim about **live** infrastructure still does not belong in
the catalog. A claim about **declared** infrastructure does. §4.1 is right about the first and silent
about the second, because with no IaC there is no second — so there was nothing for the distinction
to attach to.

**This is §5.2's supply argument, in a second place.** §5.2 already knows the witness ladder's
ceiling is set by the ecosystem and not by the claim alone, and C15 recorded one instance of it. The
same supply side also governs the §4.1 boundary, and the document does not say so. Two settled
sections, one unstated connection.

### The sub-finding, which is the more portable half

> **A static witness needs a declarative subject.**

These three claims were not strictly impossible before IaC — they were badly witnessed. The witness
available was a person reading a CI deploy script and judging what it would produce. That is kind 4
judging an artifact that is not the subject, and the deeper defect is that **an imperative script
cannot be read for its resulting state.** You would have to simulate it.

A declarative artifact can be read for exactly that, which is what makes a kind 1 or kind 2 witness
possible at all. A006's claims sit at those rungs for that reason and no other. This belongs in §5.2
beside the ladder, because it names a precondition the ladder assumes and never states.

### What does not move, and should be said in the same breath

The boundary moves for declarative configuration. It does not move for:

- **runtime state** — an empty backup bucket. A004's deleted second witness stays deleted.
- **out-of-band human acts** — clicking a verification link in an email. A002's draft-1 clause
  returns as a claim about the declaration, never about the verification.
- **drift** — the account diverging from the declaration. Still monitoring, still nothing crux
  catches. What changes is that there is now an artifact on the repository side to diff against,
  where before there was nothing at all.

## C21 — No artifact exists for work that changes the witness supply · `repeated`

**Where it came from.** Two units of work in this repository changed no claims and changed what
claims are **possible**:

| The work                                            | What it changed                                                                                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build: integrate Effect tsgo with Vite+ lint (#2)` | created the lint witness supply — [C15](#c15--a-third-party-type-aware-linter-is-a-witness-supply--settled), F11, F13                                |
| adopting Alchemy                                    | moves the §4.1 boundary ([C20](#c20--41s-boundary-is-set-by-tooling-not-by-principle--settled)) and raises the ladder for every infrastructure claim |

Neither is an **amendment** — §7 defines one as a set of claim changes, and neither proposes any.
Neither is **fog** — both are statable, so §10 refuses them. Neither earns a **rationale** — §11.2
wants hard to reverse, surprising, and a real trade-off, and a lint integration is none of the three.

So both produced no artifact. The second needed a migration plan long enough to be worth writing
down, and it went to `.scratch/ALCHEMY-MIGRATION.md` — a filename crux does not know about, in the
one directory whose contents crux does specify.

**Why this is the gap worth closing.** A claim change moves one promise. A supply change moves the
ceiling for every promise that comes after it, including ones nobody has thought of. §7 gates the
first and nothing gates or records the second, which inverts the stakes. §13.1 sequences the tools
crux will build; it does not notice that the tooling **around** crux is what decides what the catalog
can hold.

**Not proposing the fix.** Either a fourth amendment operation, or a named artifact beside the
amendment, and the choice is crux's. Recording that the gap has now been hit twice, and that the
second hit was the more consequential of the two units of work in this repository's history.

## C22 — An amendment has no vintage · `watch`

A002 through A004 were authored under §5.9's retracted predecessor and then sat unenacted while the
framework moved. Nothing in the repository marked them stale: no rule version on the amendment, no
form error, no marker. A005 exists because a person remembered, and A002 and A003 were revised three
sessions later for the same reason.

Crux checks claims against witnesses continuously and checks amendments against the framework never.
An amendment is the one artifact that sits unenacted long enough for the framework to move underneath
it — a rationale grounding a deleted claim is the same shape at the other end of the pipeline (§11.5),
reported and not an error.

**Deliberately filed low.** The operator's ruling, and it is the right one: an underspecified
framework moving under an unenacted artifact is expected rather than defective, and this stops
mattering the moment crux stabilises. Recorded so the observation is not lost, not as a request.

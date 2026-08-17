# Fog log

Append-only. Where tracking fog and converting fog into an amendment actually hurt.

The test that matters: a by-hand step that felt **clerical** is a candidate for the tool to
absorb; a by-hand step that felt like **thinking** must never be automated.

Findings destined for crux or cairn are stated in
[`CRUX-FEEDBACK.md`](./CRUX-FEEDBACK.md) and referenced here by number.

---

## 2026-08-17 — splitting `ABSTRACT.md` into crux artifacts

One document of 344 lines became a glossary, six rationales, a gotchas file, a runbook, ten fog
items, and five proposed amendments. No code was written.

### Clerical — candidates for cairn

**Transcribing a prose promise into slug, kind, and witness.** About thirty repetitions of the
same three-field shape. The judgment is upstream of the transcription; the transcription is
typing.

**Keeping `@grounds` slugs consistent with amendment slugs.** Grep and hope. See **C4**.

**Deciding which of five files a paragraph goes to.** Claim / rationale / gotcha / runbook / fog
was almost always obvious after the first pass, but it required holding all five destinations in
mind for every paragraph of the source. The routing was clerical; settling the five categories
was the thinking, and that happened before the work started.

**Answering "what blocks what".** The gate table in `amendments/README.md` was assembled by
reading ten fog items against five amendments by hand. It is a join, and a join is what a
tracker is for.

### Thinking — never automate

**Is this a claim, or is it settled by construction?** See **C8**. Went the counter-intuitive way
twice out of two.

**Choosing the altitude of a claim.** See **C9**.

**Assigning the witness.** See **C3**. The strongest signal in the session: the witness
assignment, not the claim text, is where the design happened — three times, in one sitting.

### Friction with crux itself

Recorded as **C1** (out-of-repo subjects), **C2** (forward-dangling `@grounds`), **C5** (an
amendment with no branch to live on), **C6** (fog churning in the product's history), **C10** (a
claim needing two witnesses to be honest — later retracted), **C11** (a root project with no
claims).

### One thing crux got exactly right

See **C7**. Reframing §15's open decisions as fog with exit gates exposed a contradiction the
source document had not noticed, and it surfaced while the gate was being written rather than on
reflection afterwards.

---

## 2026-08-17, later — the first five rulings

Five open questions closed in one round. Three of them changed artifacts that had already been
written, which is the first real evidence about rework cost.

**The out-of-repo question closed by deleting claims, not by finding a witness for them.**
Amendment 003 — four claims, the longest single argument in the tracker — was deleted outright
under **C1**. Notably, the ruling also _corrected a claim that had already passed review_:
`checkin/email/from-is-onboarded` was written as one sentence, and the new rule cut it in half,
keeping the part `wrangler.jsonc` can answer and discarding the part only Cloudflare can. A rule
sharp enough to split a sentence that already looked fine is a rule worth having.

**A settled fog item cost more than an unsettled one.** F5 (the note field) cleared by judgment —
include it — and clearing it reopened A001, which had been written assuming the column might not
exist. Cost: one new claim, one changed schema line. Cheap here, and only because no code
existed. The generalisation to watch: **the price of a fog item is paid by whatever was written
while it was still fog**, so an amendment authored over open fog is a liability, not progress.

**F8 discharged into a rationale, not a claim** — the minority exit — and it happened on the
first project to try. Worth watching whether that stays a minority path in practice or whether
the ratio is different for application repositories than for tool ones.

**`workspace` turned out to be empty.** See **C11**. Deleting the infrastructure claims left no
claim belonging to the repository root, so a prefix that crux introduces as a matter of course is
one this project never uses.

---

## 2026-08-17, later still — four more rulings, and a new blocker

**Three of the four cleared fog items changed a claim rather than adding one.** F4 asked for the
send hour; the answer was "21:00, configurable", and the claim it unblocked never mentions 21:00.
F9 asked which domain; the answer was "not in the repository", and the email claim was rewritten
for the second time. F6 asked about a chart and produced no artifact at all.

That ratio is the finding. Going in, a fog item looked like a claim-shaped hole waiting to be
filled. In practice, clearing one mostly **reshaped claims that already existed**, and only once
added a new one. If that holds, a tracker that models fog as "pending claims" has the wrong
model — see **C13**.

**A claim was rewritten twice by two different rules and ended up better than any draft.**
`checkin/email/*` went from naming a verified recipient (cut by **C1**), to naming a subdomain
(cut by **C14**), to naming no value at all: no address is a literal, every address is built from
configuration. Nobody chose the final version — it is what was left. And it is the only one of
the three that catches the failure that would actually happen, a hardcoded address pasted in
while debugging. Its witness moved up a rung too, from a test to a lint rule.

**The cheapest new claim came from asking what a fallback would do.** `core/config/has-no-silent-defaults`
exists because F4's answer made the time zone configuration, and `env.TZ ?? "UTC"` is what a
reasonable person writes: it type-checks, it never throws, it silently misfiles every entry, and
every date test still passes. Nothing in `ABSTRACT.md` implied this claim. It came from asking
what happens when a newly-configurable value is missing.

**A001 went from unblocked to blocked in the same round.** F11 — whether Effect-ts is a house
rule — arrived attached to a question about deferring boilerplate development claims, and it is
not that kind of question. It changes the witness kinds in the module every other amendment
depends on. Adopting it after A001 means rewriting the claims and re-auditing every witness
attesting them.

The general shape, worth watching: **an item that presents as a preference about tooling can be
load-bearing on the catalog**, and the thing that revealed it was asking which witness each claim
would get. Nothing about "should we use Effect-ts" looks like a claim question until you notice
it moves claims between kinds 1 and 2.

---

## 2026-08-17, final round — F11 clears, and the tracker empties

**A fog item was answered by looking something up.** F11 asked whether Effect-ts is a house rule.
It cleared by judgment — the decision was the human's — but the _shape_ of the answer came from
reading two repositories and checking three version numbers against this one. Neither of the two
things that made the decision easy was known when the question was asked:

- the Effect linter emits its rules as Oxlint rules, so ~80 witness handles arrive for free
  (**C15**)
- TypeScript 7.0.2 is already in the catalog and is exactly the version the linter requires

Worth naming because it cuts against how the clerical/thinking split has looked so far. The
judgment was unmistakably the human's. The _facts that made it decidable_ were an agent's, and
gathering them took two fetches. **Cairn should treat "what would clear this?" as a field on a
fog item**, because for F11 the answer was a URL, and nothing in the tracker had a place to put
it.

**The item changed category while being answered.** F11 entered as a preference about tooling,
attached to a decision about deferring boilerplate. It was actually a question about what the
catalog can promise structurally — a claim's witness kind is part of the claim, so "which
library" and "kind 1 or kind 2" turned out to be the same question. Nothing marked it as
load-bearing; noticing came from asking which witness each claim would get.

**One claim moved up a rung, and one house rule retired.**
`core/config/is-required-not-defaulted` went from a test to a type plus a test — under a context
service there is nowhere left to write `?? "UTC"`. And "no floating promises" now guards an empty
set, replaced by `floatingEffect`.

**A001 is unblocked and is the next unit of work.** Ten claims, nothing gating them.

---

## 2026-08-17, F12 — the first repeat

**F12 cleared by one grep of a lockfile.** It had been written as "install the thing, enable a
rule, run `vp lint`". The answer was already in the repository: `oxlint@1.77.0` against a floor of
1.77.0, `typescript@7.0.2` against a floor of 7.0.2, and `oxlint-tsgolint@7.0.2001` already
installed with `typeAware: true` already switched on.

**This is the same pain point as F11, and that makes it the log's first repeat.** In both, an item
was framed as requiring work, and the fact that settled it was already sitting somewhere cheap. In
both, nothing in the tracker had a place to record what would clear it, so the cheapness was
discovered rather than planned. Written up as **C16**.

By the dogfooding rule this is the moment the log stops being anecdote. One occurrence redesigns
nothing; a repeat is the input to the tracker design. So the first concrete requirement cairn has
earned is not a schema for claims — it is a **what would clear this** field on a fog item, and an
exit taxonomy cut by _inside the checkout or outside it_ rather than by _judgment or evidence_.

**A second observation, unprompted by any question.** The lint-witness mechanism now rests on a
version this repository does not pin: Oxlint is transitive through `vite-plus` and sits exactly at
the required floor. A toolchain downgrade would break every development-claim witness by having
rules quietly stop firing — no error, no failed build, just silence. That is precisely the shape
of failure crux's dead-scope check exists to catch for `@scope`, and there is no equivalent for a
lint rule whose engine disappeared beneath it. Recorded against **C15**, which is the finding it
undermines.

---

## 2026-08-17, at the commit — a stale gate shipped

Committing the tracker surfaced the second repeat, and this one by failing rather than by
noticing.

`amendments/README.md` claimed A001 was gated by F11, in the sequence table and again in the
prose. F11 had been cleared earlier in the session and `001-the-core.md` correctly said "gated by
nothing". **The index disagreed with the thing it indexed, and it was committed that way** — no
error, no hook complaint, found by a grep run for an unrelated reason a minute later.

This is the third instance of one shape: a fact written in two files with nothing that knows they
are the same fact. The other two were a claim slug living in both a rationale and an amendment,
and the project list existing only as an assumption. Written up as **C4**, now `repeated`.

**The two repeats point the same way.** C16 says a fog item must record what would clear it. C4
says the tracker must hold each fact once and derive every view. Neither is a schema for claims,
which is what a tracker looks like it should be. Both are about **the tracker's own consistency**,
which is the part that was invisible until the thing existed and had to be maintained.

Worth noting that crux itself does not have this problem and says why: the marker index is
derived on every run and stored nowhere, and a witness needs no stable identity because a diff
answers every question about it. The by-hand tracker took on a class of bug the format it serves
deliberately avoids.

---

## 2026-08-17, after the commit — discussion, and four findings that came from nothing

A session with no artifact in front of it. The tracker was committed and the conversation moved
to what it implied for crux. Four things came out, and **three of them could not have been found
by doing the work** — they came from reading the work back.

**C17 was found by opening a file in a Markdown viewer.** Every `@grounds` in
`docs/rationale/` is invisible in every rendered view, because §6.3 chose HTML comments. Doing
the work never surfaces it; the directives are right there in the editor. It took looking at the
output the way a reader would.

**C18 was found by asking "what if the repo needs these words?"** — a question with no prompt in
the work at all. The answer had a shape nobody predicted: the four ordinary English words all
collide with real ecosystems, and the two unusual ones are clean. And the collision that matters
is not the likely one. `@kind` and `@scope` are the plausible collisions and both fail safe;
`@end` is the far-fetched one and it is the only one that fails _unsafely_, because a stray
terminator under-extends a marker and §6.2 says that is the one direction that lets a false
witness survive.

**C10 was retracted, and the retraction is better than the finding.** Both of its examples were
wrong, and one was wrong because of a change made earlier in the same session that I did not
propagate. The correct version — a claim wanting two witnesses of different kinds is two claims —
then held on a third case, one written _after_ the original finding. Worth recording that the
error survived being written down, committed, and summarised, and died the first time someone
argued with it.

**C2 reversed.** The original ruling let `@grounds` dangle forward; the reversal makes it a form
error and ships the rationale with its claims. That closes exactly one of C4's three instances,
which is itself the useful signal: the remaining duplication is between the tracker and the
repository, and no rule inside the format can reach it. That is what cairn is for.

### What this says about the clerical/thinking split

The split was drawn as _transcription is clerical, judgment is thinking_. This session does not
fit either column. Nothing was transcribed and nothing was decided about feelsie — the entire
output was **finding errors and gaps in the framework by re-reading artifacts already produced**.

Three of the four came from adopting a reader's position rather than a writer's: opening the file
in a viewer, asking what a foreign repository would contain, arguing with a claim already
committed. None of it is automatable and none of it is judgment in the sense §9.5 means. It is
closer to review — and crux already knows the shape, since **the gate is applied by somebody who
did not build**. What this session suggests is that the principle extends past the code to the
framework itself, and that the review has to be a separate act, because the writer of an artifact
cannot see what the reader of it will.

### Not yet observed

- A claim that had to be reworded after its witness was **built**. No code yet.
- An amendment that had to change during a build. No build yet.
- What had to be re-derived at the start of a session. Two sessions, contiguous.

**The period ends when a pain point above repeats.** One occurrence is an anecdote.

---

## 2026-08-17 — F13, Effect rules through Vite+

**The composition worked.** `@effect/tsgo` patched the same Oxlint binary and type-aware bridge
that Vite+ invokes. A floating Effect in the sample app produced
`effecttsgo/floating-effect` through `vp lint`. Removal of the violation restored a clean lint
result.

### Clerical — candidates for tooling

**The supported version set needed four exact catalog entries and one repeatable patch command.**
The Effect setup command can automate a standalone Oxlint configuration, but Vite+ owns that
configuration inside `vite.config.ts`. The integration therefore needed manual edits across the
catalog, root dependencies, the prepare script, and the Vite+ configuration.

**One wrong configuration location existed in four documents.** F11, F13, C15, and the Effect
rationale all said that rule severities lived in `tsconfig.json`. Current Effect documentation
puts Oxlint severities in `vite.config.ts`. Correcting one fact in four places is another C4
instance.

### Thinking — never automate

**The TypeScript and Oxlint diagnostic paths needed one owner.** The language service remains
enabled for editor features, but its diagnostics are off. Oxlint owns diagnostics, so the same
Effect finding does not appear twice.

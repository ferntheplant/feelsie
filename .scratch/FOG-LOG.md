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

---

## 2026-08-17 - A001 implementation

The first implementation pass converted A001 into a core package, one migration, and fourteen
declared claims.

### Clerical - candidates for tooling

**Claim counts drifted.** The log said ten, the amendment held eleven, and the implemented splits
produced fourteen. See **I3**.

**One slug changed in several homes.** The CSPRNG split changed the amendment, catalog,
rationale, markers, and feedback. This repeats **C4**.

### Thinking - never automate

**The CSPRNG witness changed the claim again.** A lint rule that prohibits `Math.random` cannot
prove that production uses Web Crypto. The implementation needed a positive test claim and a
negative lint claim. See **I1**.

**The expiry instant needed a ruling.** The original six-day and eight-day examples did not
settle the exact seven-day boundary. The operator ruled that expiry starts at that instant.

**A green canvass hid six false markers.** A fresh reviewer found implementations that violated
the claims while every test still passed. The repaired tests now force the named mechanism and
the exact boundaries. See **I4**.

### Framework friction

**The required configuration claim needed a second split.** A fresh audit marked the mixed type
and test markers false. The operator separated context structure from runtime absence. See
**I2**.

### Re-derived at session start

The implementation had to recover the marker grammar, project declarations, rationale grounding
rules, and amendment lifecycle from the Crux repository. The tracker held no concise builder
entrypoint for that material.

---

## 2026-08-18 - A005 altitude correction

A005 replaced six check-level claims with two reader-visible claims. The first independent
coverage audit changed the amendment before the gate ran.

### Clerical - candidates for tooling

**Six old slugs became two across markers, the catalog, rationales, and feedback.** The work was a
manual reference migration. This repeats **C4**.

**The feedback record still held a retracted rule after Crux changed.** `CRUX-FEEDBACK.md` called
witness-kind splits the corrected rule. Crux §5.9 now states the opposite. The stale copy required
another manual repair.

### Thinking - never automate

**Sound individual witnesses did not settle coverage.** The new configuration claim combined
three instruments. Reading them as a set exposed the untested upper boundary `24`.

**Partial checks needed production-path connections.** A second audit found that secure token
generation did not prove secure storage. It also found that strict decoding did not prove that the
production layer used the decoder.

**The claim text had to return to reader altitude.** The token claim initially repeated its byte
source, output shape, and lint prohibition. Crux §5.9 identified those as checks, not promises.

### Framework friction

**A005 audited coverage after it prohibited witness edits.** The audits found required test edits
after the metadata migration started. The operator revised the amendment. See **C19**.

### Re-derived at session start

The amendment named every affected marker and rationale. The implementation still had to verify
the references and recover the coverage rule. The stale C10 record gave the opposite rule.

---

## 2026-08-18 — adopting Alchemy, phases 0 through 2

The spike, the dependency shape, and the Core Stack. No claims changed, which was the point: this
was a change to the witness supply, and the catalog is identical on both sides of it.

### Clerical — candidates for tooling

**The install landed in the wrong place and nothing said so.** `vp add --workspace-root` put
`alchemy`, `effect`, and both `@effect/platform-*` packages into the root's `dependencies`, with
`effect` pinned to a literal version beside three `catalog:` entries. Every one of those is a
house-rule violation — the root carries devDependencies only, and versions come from the catalog —
and the only thing that noticed was a person reading the diff. `vp check` was green throughout.

**Four files had to agree about one new directory.** `prototypes/` needed an entry in
`pnpm-workspace.yaml`, in `fallow.toml`'s `[workspaces]` patterns, a `tsconfig.json` of its own,
and a line in `AGENTS.md`. Miss any one and the failure is silent rather than loud: no workspace
entry means no dependency resolution, no fallow pattern means the package is invisible to dead-code
analysis. This is **C4** in a new costume — the tool owns the cross-references, and there is no
tool.

**Recording the same finding in three registers.** Each of the spike's three mechanical
discoveries went into `AGENTS.md` as a rule, into the spike's `README.md` as a narrative, and into
`ALCHEMY-MIGRATION.md` as a correction to what the document had assumed. The three audiences are
genuinely different, so the duplication is not obviously wrong — but nothing links them and
nothing will notice when one drifts.

### Thinking — never automate

**Deciding that a required-but-unused credential does not break rederivability.** The whole
migration hung on this. Alchemy demands a Cloudflare credential before it knows the stack is fully
emulated, and then never authenticates with it. Reading that as "the claim is still rederivable
from a checkout" is a judgment about what a witness _depends_ on rather than what it _asks for_,
and no tool offered the distinction. See **C23**.

**Choosing to drop `@effect/platform-bun` rather than catalogue it.** The recommended install
command names it, so the default move is to pin it and move on. Establishing that it is an optional
peer, dynamically imported behind `typeof Bun !== "undefined"`, and therefore dead on every path
this repo takes, meant reading Alchemy's `Util/PlatformServices.ts` and confirming that its
seventeen other mentions are all inside generated-code template strings. The house rule says dead
code gets deleted; applying it to a dependency required knowing which branch runs.

**Reading the D1 client's signature as a claim about failure.** `Cloudflare.D1.QueryDatabase`'s
executors are typed `Effect<A, never, RuntimeContext>` — a SQL error is a defect, not a typed
failure. `DatabaseShape` promises `DatabaseError`. Nothing would have failed loudly if `src/d1.ts`
had let defects through; the `node:sqlite` tests would still pass, and the difference would first
appear as a killed fiber in production. The adapter converts them, and re-raises interruption
untouched, because a cancelled request is not a database failure.

### Framework friction

**A build change that raises the witness ceiling still has no artifact.** This is **C21**, third
occurrence, and it is now the most expensive one. The work produced a spike, a harness script, four
house rules, two corrections to its own design document, and a `watch`-status finding — and the
only place any of it is tracked is a `.scratch/` markdown file that says "proposed" at the top and
is maintained by remembering to. The catalog is unchanged, correctly, and so the repository's own
records show that nothing happened.

**The design document was wrong in two places, and being wrong was cheap.** §2's file table
assigned `src/database.ts` to the D1 resource, which is already the `Database` service, and §9.3's
class form dies at runtime. Both were caught by running the code within an hour. Worth recording
because the document was written carefully from twenty pages of documentation and still got the two
things wrong that only a run could settle — which is an argument for the spike gate, not against
the document.

### Re-derived at session start

The Alchemy docs pages named in §8 are the current API; the GitHub README, the vendored
`llms.*.txt`, and two of the three Context7 indexes describe the v0.x API and share almost no
surface with it. The installed package's own `src/` shipped in the tarball and was the cheapest
source of truth by a wide margin — every API question in this session was settled by reading
`node_modules/alchemy/src/`, not by reading documentation.

---

## 2026-08-18 — collapsing four slug prefixes to one

`ONE-PROJECT.md`, enacted. Ten enacted slugs and about sixteen proposed ones moved to the `root/`
prefix. No claim's truth changed, no witness moved, and `vp run ready` was green on both sides.

### Clerical — candidates for cairn

**Finding every mention of a slug.** Four greps with hand-tuned exclusions, because a slug is a
slash-separated string and so is every path in the repository — `core/token/cannot-be-guessed` and
`packages/core/src` are the same shape to `grep`. The join cairn owes here is **C4**, third
occurrence, and this is the occurrence where it had to be run in reverse: not "is every reference
consistent" but "where are all of them".

**Transcribing the same rename into four unrelated syntaxes.** A blockquote in the catalog, a
blockquote in each rationale, a `//` comment in four test files, and a `/* */` comment inside a
config map. Crux's whole-file-agnostic directive format is what made this survivable — the same
edit, five times, with no parser involved.

**Re-reading each amendment to find the prose the rename falsified.** The slug edits were
mechanical. Finding the sentences that stopped being true — _"That gives `root` its first
claims"_, _"`root/` gets its first claim in 006"_, a `Project` column that is now one value in
every row, a `## Before any claim here is legal` section per amendment naming a package glossary
that will never exist — was reading six documents end to end. A tool that knew which claims exist
could have flagged the first two and never the last two.

### Thinking — never automate

**Deciding which mentions of a slug are citations and which are records.** This is the finding of
the session and it is **C24**. `ONE-PROJECT.md` had already ruled on `FOG-LOG.md` and
`CRUX-FEEDBACK.md`; it had not reached `fog.md`'s cleared items, the two enacted amendments, or
A002's own "renamed from" notes. All three are records, all three had to be left alone, and none of
them is distinguishable from a stale citation by anything a machine can see. A rename tool that
ran on slug identity would have quietly rewritten the account of what this project cost.

**Ruling on the name.** The document argued for `feelsie` and the operator chose `root`, which the
document had called the weaker reading. The reason it was right anyway is **C25**: the segment
carries no information in a one-project repository, so it should be decided on migration cost, and
`root` was already declared in the root `GLOSSARY.md`. The document had weighed how the slug reads
and not what the choice costs to enact.

**Ordering the steps around a form error.** `packages/core/GLOSSARY.md`'s `@project core` had to be
deleted **last**. Deleting it first would have made all ten live claims **misfiled** — a real crux
form error, correctly reported, on a repository that was mid-migration and fine. The sequence in
`ONE-PROJECT.md` got this right in advance, which is the clearest evidence in the exercise that
writing the sequence down before doing the work is worth its cost.

### Framework friction

**Two homes the plan did not list, and both were load-bearing.** `CRUX.md` carried a paragraph
whose whole subject was this document being unfinished, and `amendments/README.md` carried a table
column and a section heading the collapse falsified. `CRUX.md` is the file every session reads
before writing a claim, so a stale prefix there would have propagated into the next thing anybody
wrote. Neither appears in `ONE-PROJECT.md`'s table of homes, because that table was built by
searching for _slugs_ and these two hold _prose about slugs_.

**A grep found four of five homes, and the form check found the fifth.** `0001_core.sql` carries
two schema witnesses, and every grep in this session had a file-type filter that excluded `.sql` —
the filter existed because a slug and a path are the same shape (above), so the search had to be
narrowed to be usable at all. The narrowing is what hid it. What caught it was resolving every
`@attests` against every `@claim` and printing the ones that did not resolve, which is crux's
**orphaned** check written as six lines of shell and run after the work looked done. **The lesson
is not "grep harder".** A search over text needs to know where witnesses live; a resolution over
slugs does not, and only the second one is a check. This is the strongest argument the exercise has
produced for the form checks being tooling rather than discipline — they took minutes to write,
they found a real defect that careful reading had missed twice, and they do not care what language
the witness is in.

**`packages/core/GLOSSARY.md` was deleted rather than emptied.** The plan said to delete its
`@project core`. What remained after that was a heading and a sentence pointing at the root
glossary — and `CRUX.md` already says a package glossary holds no words and that the root one is
the only one. An empty file that exists only to say it is empty is the kind of artifact a hand-run
process leaves behind and a tool never would.

---

## 2026-08-18 — clearing F1, and three documents that had gone stale

One spike, one fog item cleared, one amendment rewritten, one contradiction resolved, and one
amendment written that had been "deferred" for three revisions.

### Clerical — candidates for cairn

**Re-deriving what a fog item blocks.** F1 said "blocks A002". Working out what in A002 it blocked
meant reading five claims and their witness sets to find the two sentences that would change. The
fog item knew the amendment; it did not know which claims, and it is the claims that move. That is
a join, it is **C4** again, and it is the fourth occurrence.

**Propagating one cleared item to four files.** `fog.md` (move the entry, edit the index table),
`amendments/002` (the gate line and the blocked-on paragraph), `amendments/README.md` (the `Gated
by` column), `ALCHEMY-MIGRATION.md` (the status banner and Phase 3). None of it is judgment and
all of it is invisible if forgotten — a stale "Blocked on F1" reads exactly like a live one.

**Checking one fact against two documents that disagreed.** A006 said MX support was unverified;
`ALCHEMY-MIGRATION.md` risk 4 said checked and cleared. Both had been true when written, and
nothing points one at the other. Settling it took one `grep` of `Cloudflare/DNS/Record.ts`, which
is cheaper than the reading that produced the disagreement — the same shape F12 recorded, where an
"evidence" item was answerable without running anything.

### Thinking — never automate

**Deciding that F1 had cleared when its residual had not.** The spike proves the send executes
from a scheduled handler in workerd against a Miniflare-equivalent simulator. It does not prove
Cloudflare's production Email service accepts one. The judgment is that no reading of the evidence
leaves the _shape_ in doubt, so what remains is a deployment verification rather than a design
question — and a fog item exists to hold design questions. Getting this wrong in the cautious
direction is not free: A002 would stay blocked on a check nobody can run until the thing A002
builds exists.

**Asking what happens when the dependency's error path runs.** The spike's second schedule exists
because somebody asked a question F1 did not: not "does the send work" but "what does Alchemy do
when it doesn't". That found the swallow, which changed A002's witnesses and added two claims
across A002 and A004. Crux's adversarial rules point at your own code; this one pointed at the
framework. **C26.**

**Deciding where the send is counted.** "One prompt, one send" is a sentence whose meaning depends
entirely on where the observation happens, and both readings look identical on the page. At the
invocation it passes with zero sends; at the binding it means what it says. No form check reaches
this, and no reading of the claim alone reaches it either — it took knowing the swallow existed.

**Grouping fifteen lint rules into four claims, and refusing to claim nine of them.** A007's whole
difficulty. One claim per rule is the A005 altitude error rebuilt from scratch, and the
discriminator took a while to find: a rule earns a claim when the code it forbids produces a
failure somebody notices at runtime or on a release; a rule that only tidies the diff does not.
Nine enabled rules are deliberately unclaimed on that basis.

**Noticing that A007's fourth claim has no home in the model.** Three of its claims are witnessed
by lint rules; the fourth is a claim _about those rules still working_. Test 4 forbids a claim that
describes its own witness and says nothing about one that describes another claim's. Three readings
fit, the awkward one is that it may be a **standing** rather than a claim, and this repository
cannot pick. **C27** — and it will not be rare, because any project whose witnesses come from a
supply has one per supply.

### Framework friction

**A rewritten amendment has no record that it was rewritten.** A004 is on its third version. The
only way to know is that the file says so in prose, because somebody remembered to write it. This
is **C22** (an amendment has no vintage) meeting **C21** (no artifact for work that changes the
witness supply) — the rewrite was driven by a spike that changed what could be witnessed, and
neither the amendment nor the catalog records the connection except by hand.

**The most valuable output of the session is in `prototypes/`, which `docs/` may not point at.**
The swallow finding changed two amendments and added two claims. Its evidence is a spike README,
correctly outside the catalog, and the amendments reach it by relative link. That is the right
arrangement and it means the finding's home is the least durable directory in the repository.

### Re-derived at session start

That `Cloudflare.D1.ExportDatabase` is an account-API operation and not reachable from a Worker,
which A004 assumed the opposite of by omission. The backup handler has to serialise rows through
the `QueryDatabase` binding. This made the claim better — the export format is repository code
rather than a vendor endpoint, so the round trip is judgeable from a checkout.

---

## 2026-08-18 — building A002, the check-in Worker

Six claims into the catalog, one package, one migration, and a capability seam through `core`
that two amendments had been describing and neither had built.

### Thinking — never automate

**Finding that two claims of one amendment contradicted each other.** The strict hour gate and
the same-date retry cannot both be true, and each claim was defensible on its own page. The tell
was in a coverage note rather than in either claim: "suppress every retry for that local date"
presupposes retries the sibling forbids. Nothing in crux reads an amendment as a whole, and
nothing reads coverage prose against anything. Escalating it produced a better claim than either
reading, in one exchange. **C30.**

**Deciding where the retry lives.** The amendment said `Effect.retry` is the retry control, and
it is wrong in a way that only shows once the gate is settled: the cron fires hourly, so the
_next fire_ is a retry if the gate lets it through, and it buys hours where an in-invocation
retry buys seconds. Two mechanisms would have needed two witnesses. Choosing between them is not
a thing a tool decides.

**Splitting `core` into capability services by caller rather than by table.** `PromptRead` and
`PromptWrite` are separate because the form reads prompts and the schedule writes them;
`EntryRead` and `CheckIn` are separate across the GET/POST boundary. A service nobody would ever
hold alone buys no witness, and the temptation is to split by table because tables are what you
can see.

**Deciding what the lint rule denies when the thing it should deny does not exist yet.** A002's
witness names the entrypoint A003 will create. Creating it empty is dead code; deferring the
witness ships an under-covered claim; denying identifiers that do not exist yet is legal, silent,
and slightly uncomfortable. **C31.**

**Reading the migration's ordering question.** Write-then-send fails towards a retry;
send-then-write fails towards a duplicate email. That asymmetry is the whole argument for a
nullable `sent_at`, a rebuilt table, and a rationale document — and none of it is visible from
the claim, which only says at most one send returns.

### Clerical — candidates for cairn

**Rewriting every one of `core`'s existing witnesses because the functions they called stopped
being exported.** Not one claim moved. The diff is large and entirely mechanical, and the risk in
it is that a witness quietly stops attesting what it did — which is the thing no tool checks and
the reason it is only _mostly_ clerical.

**Keeping six claim slugs in step across the amendment, the catalog, a rationale's `@grounds`,
markers in four test files, and two entries in `vite.config.ts`.** Nineteen mentions of six
slugs, all by hand, all silently breakable. **C4**, again, and this is the first time the marker
count was large enough to be genuinely unpleasant.

**Moving a file's header comment back above its imports, five times.** The formatter sorts
imports and treats a leading comment as attached to the first one, so a comment written above
`import { … } from "@feelsie/core"` ends up in the middle of the import block. The fix is a blank
line. It is pure friction and it damaged documentation that markers do not live in, so nothing
would have caught it.

**Discovering that pnpm caches the workspace package list.** A new `apps/checkin` was invisible to
`pnpm install` until `node_modules/.pnpm-workspace-state-v1.json` was deleted. Cost ten minutes
and taught nothing.

### Framework friction

**A witness that passes on the first run has told you nothing about whether it can fail.** Four
structural witnesses were deliberately broken and watched to deny; the fifth turned out to have
been silently disarmed by an Oxlint override replacing the base rule's options. Crux puts the
adversarial duty in the _audit_, on somebody who did not build — and this particular check does
not need independence, only discipline, and it is much cheaper in the build. **I5.**

**The seam carries no claim, and "carries no claim" was read as "is small".** Both A002 and A003
said so in one sentence each. It was a migration, a table rebuild, a package-exports change, and
a rewrite of thirteen witnesses. **I6.**

**A witness needed a working directory, and the model has no slot for one.** `migrationsDir` is
relative on purpose; a real deploy pins the directory with `vp exec -F`; a test has
`process.chdir` and a comment. Everything this repository leans on to describe what a witness
needs — the Effect requirement channel — describes what the _program_ needs, and says nothing
about the process. **C29.**

**The witness ladder's ceiling was set by what could be built, not by what was installed.** Oxlint
ships no rule that can see a string literal, and Oxlint can load a rule that does. Forty lines
kept the witness at kind 3. The model asks whether a rule exists; the question is whether one can
exist and what it costs. **C28.**

### Re-derived at session start

That `apps/checkin` did not exist. Every cross-reference to it in A002, A003, A004, A006,
`ALCHEMY-MIGRATION.md`, and `fallow.toml` was written against a package that had never been
created, and working out which of those references were decisions and which were assumptions took
longer than writing the package.

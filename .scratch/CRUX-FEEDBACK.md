# Crux and cairn — findings to port

Feelsie is the first project built under the crux vocabulary that is not crux itself. This file
is the queue of what that turned up, written so it can be lifted into crux's `ABSTRACT.md`
without re-deriving the context.

[`FOG-LOG.md`](./FOG-LOG.md) is the chronological diary and refers to these by number. This file
is the authoritative statement of each one.

**Status** is `settled` (decided here, port it), `open` (evidence recorded, no decision), or
`watch` (one occurrence — needs a repeat before it means anything).

---

## C1 — A claim's subject must be rederivable from the repository · `settled`

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

## C2 — A rationale may ground a claim that does not exist yet · `settled`

Crux covers a rationale grounding a **deleted** claim: reported, not a form error, because the
document is still true. It says nothing about grounding one that has not been written yet, and
the orphan check does not reach it, because a grounding is not a marker.

Feelsie produced six rationales before a single line of code, and every `@grounds` in them
dangles forward. This is not an edge case — it is what reasoning-before-building looks like on
day one, and it stays the common case in any repository where design precedes implementation.

**The ruling.** Legal, and reported, exactly as the deleted case is, and for the same reason.

**To port.** A second sentence in §11.5.

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

## C4 — Cairn owns the slug namespace, because nothing else exists yet · `open` (for cairn)

Two symptoms, one cause.

**The project list must exist before the first slug can be written.** A slug prefix names a
project and a prefix naming no project is misfiled, so authoring the very first claim required
inventing the package layout (`packages/core`, `apps/checkin`, `apps/dashboard`). That was fog,
and it blocked every other item in the tracker until it was guessed at.

**Nothing checks a slug while the claim does not exist.** Six rationale files reference eight
slugs that live only in the tracker. Crux would catch a dangling `@attests`; it cannot catch
this, because per C2 the claim legitimately does not exist yet. So the correspondence between
what a rationale grounds and what an amendment proposes is maintained by grep and hope.

Cairn is the only artifact present at the moment a slug is first written, so it is the only
thing that can own either.

## C5 — An authorable amendment has nowhere to live before there is a branch · `open`

An amendment is held by the branch and enacted by the merge. Feelsie has five authorable
amendments and no branch, so they sit in `.scratch/`. Direct evidence for the open thread on
where the amendment lives: the answer cannot be "a file on the branch" alone, because amendments
exist and are worth ordering before any work starts.

## C6 — Fog in the target repository interleaves with product history · `open`

`.scratch/` is committed for now, so every clarification of a fog item becomes a commit in
feelsie, mixed with commits that change the product. This is the argument for a second
repository keyed to the target, observed rather than predicted. Accepted deliberately until
cairn has a design; revisit when a single fog item has churned three times.

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

## C10 — A claim can need two witnesses of different kinds to be honest · `watch`

§5.7 covers one marker attesting several claims. The inverse showed up twice here and is not
discussed: a claim where **neither witness alone attests it**.

- `core/token/is-random` — the test cannot distinguish a CSPRNG from a good PRNG, so on its own
  it affirms a token generated by `Math.random`. The lint rule closes that and the test cannot.
- `backup/lands-in-r2` — the test proves the code _can_ back up; only observation proves it
  _has_. A green test over an empty bucket is the exact failure the claim exists to catch.

Distinct from §5.7's coupling problem, which is about one witness serving many claims. This is
many witnesses required by one claim, and the readout's one-row-per-claim shape has no obvious
place to say "both of these, or neither".

## C11 — The root project may hold no claims at all · `watch`

§3.4 names the repository root as a project when it holds claims of its own. After C1 removed
the infrastructure claims, feelsie has none — every claim belongs to `core`, `checkin`, or
`dashboard`. The root's plausible claims are all development-kind (conventional commits, the
lint rules, the gate), and this project has deferred them (F11).

Not a defect. Worth knowing that an application repository may reach a working catalog without
ever using the prefix, where a tool monorepo like crux's own uses it immediately.

## C12 — The root project is named `root`, not `workspace` · `settled` (against crux)

§3.4 chose `workspace` over `root` on the grounds that the document already uses _root_ to mean
a position rather than a thing. Feelsie's author — who is also crux's — preferred `root` on
first contact with the name, so this project uses `root/`.

**The stated objection is real and survives the decision.** The prose in this repository says
"the repository root" and "the root project" within a page of each other, and the reader
disambiguates from context every time. What the collision costs in practice is not yet known,
because no `root/` claim exists here yet (C11) — so this is a divergence recorded at the moment
it was chosen, to be judged when the prefix is actually in use.

The interesting part is not which word wins. It is that the first consumer of the vocabulary
rejected a settled naming decision on sight, and §2.2 exists precisely so that rejected words
are not re-proposed. If crux adopts `root`, §3.4's reasoning should be moved into §2.2 as a
rejected word with its argument intact, rather than deleted.

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

> rule id in `tsconfig.json` → marker on that line → Oxlint report → existing adapter → verdict

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

**JSONC saves it, and §6.3 should say which files qualify.** `tsconfig.json` is where the rule
severities are declared, and a `.json` extension implies no comments — §6.3's case for a file
that cannot hold a marker. TypeScript reads it as JSONC, so it can. The same is true of
`wrangler.jsonc`. Both of feelsie's config-hosted markers live in files that look unmarkable and
are not, and §6.3's advice to "move the file to a format that takes comments" would have been
followed unnecessarily in both cases.

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

# A003 — the dashboard

**Project**: `root` · **Package**: `apps/dashboard` · **Status**: proposed · **Gated by**:
A001, F7

SvelteKit on `adapter-cloudflare`, bound to the same D1 database, behind Access.

## Revised after A005

Written before §5.8 (coverage) and §5.9 (group by the failure a reader can see), and both claims
below were argued under the rule those sections retract — that a claim takes one witness, so
choosing a witness means rejecting the others.

Both claims survive unchanged. Both witness sets do not.

- `root/dashboard/never-writes` picked the type witness and argued the test and the lint rule were
  "both worse". Under §5.8 they are supplements, not rejected alternatives — and the type witness
  as described does not close what the amendment thought it closed.
- `root/dashboard/shows-the-history` settled for a kind-4 witness file on the grounds that a test
  "attests something narrower than the claim". §5.6 retracts precisely that: **sound does not
  mean sufficient**, and narrower is sound. Most of that claim comes down two rungs.

## Add

### `root/dashboard/never-writes`

**Kind**: capability
**Claim**: The dashboard cannot write to the database.

**Witnesses** — three:

| Kind | Attests                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| type | the dashboard's pages are typed against named read operations; `Database` and its SQL interface are not in scope |
| lint | `platform.env.DB` is denied under `apps/dashboard/**` outside the module constructing the read layer             |
| test | `apps/dashboard/wrangler.jsonc` declares exactly the expected bindings                                           |

**Coverage.** Three ways to reach the database, one witness each. The type closes what a page can
**call**. The lint closes the bypass the type cannot see: `env.DB` is a live D1 handle whatever
`core` hands out, and `platform.env.DB.prepare("INSERT …").run()` type-checks in any page that
reaches for it. The config test closes a _second_ binding added later, which the lint rule —
keyed to one identifier — would not notice.

#### The type witness needs a design decision one level deeper than this amendment knew

The original text: "the dashboard receives a handle whose interface exposes no write operation.
There is no method to call." That is the right instinct and it is not achievable against `core`
as built. `DatabaseShape` is:

```ts
readonly first: (statement: SqlStatement) => Effect.Effect<Option.Option<SqlRow>, DatabaseError>;
readonly batch: (statements: ReadonlyArray<SqlStatement>) => Effect.Effect<void, DatabaseError>;
```

Dropping `batch` does not make a write unrepresentable. `first` takes arbitrary statement text and
runs it — `raw.prepare(text).get(...)` at
[`test-support/sqlite.ts:29`](../../packages/core/src/test-support/sqlite.ts) — so
`INSERT … RETURNING` executes and returns its row, and D1's `.first()` behaves the same way. A
"read-only handle" built by narrowing `DatabaseShape` writes fine.

So the dashboard cannot receive a SQL-taking interface at all. It receives named operations —
`listEntries()`, `readEntry(date)` — whose SQL is closed inside `core`, and it never has
`Database` in scope. This is the same seam A002 needs for `root/checkin/form/get-does-not-write` and
`root/checkin/routes/expose-no-history`; it carries no claim of its own and lands in whichever
amendment merges first.

Crux §7 says naming a witness starts the design and **writing** it finishes the design. This is
that, one step later than usual: the witness could not be written until `core` existed, and the
gap was invisible from the amendment alone.

#### What the rejected witnesses actually add

The original argument was that a test proves the claim "about the paths the test walks" and a
lint rule banning write methods is "a rule about spelling". Both observations are still true and
neither is a reason to omit the witness — a witness that reaches part of a claim is sound (§5.6),
and coverage is the separate question.

The spelling objection did real work, though, and it survives as the reason the lint rule is
aimed where it is. A rule matching `db.prepare("INSERT …")` recognises a string. A rule matching
`platform.env.DB` recognises an identifier the compiler also knows about. The first is a guess;
the second is exact.

`ABSTRACT.md` stated this as "the dashboard reads data only. It writes no data" — a sentence
about intent. Assigning a witness turned it into a decision about who hands the dashboard its
database handle, which is a design decision that would otherwise have been made by accident.

### `root/dashboard/shows-the-history`

**Kind**: capability
**Claim**: The dashboard shows every entry, most recent first, with its three measures and its
note.

**Witnesses** — two:

| Kind         | Attests                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| test         | render against a fixture: every seeded entry appears, in descending local-date order, with all three measures and its note |
| witness file | `@scope apps/dashboard/**` — a reader judges the rendered page against the same fixture                                    |

**Coverage.** The test reaches the falsifiable half — completeness, ordering, and field presence
— and each of those is a way the claim fails that a person reading a page would have to count
rows to catch. The witness file covers what remains and what prose owns: that the page **shows**
the history rather than merely containing the strings.

**This is one claim, not three.** _An entry is missing_, _the order is wrong_, and _the note did
not render_ can each fail while the others hold, and they are not three different things to the
person the promise is made to — they are one thing, _my history is not showing up right_. §5.9
groups by the failure a reader sees, and the count of checks it takes to hold that up is four,
not one.

The original text rejected the test outright: "a test that asserts the presence of table rows
attests something narrower than the claim says — which is exactly the condition an audit is
supposed to catch." That was the rule of the day and it is retracted. An audit catches a witness
that is **irrelevant** to its claim (unsound) and a set that **falls short** of its claim
(under-covered). A sound witness reaching part of a claim is the ordinary case, and paying kind 4
for the whole of this claim was over-paying by two rungs on the part a runner can judge.

### Statistics — **blocked**

**Blocked by**: F7.

Trend lines, weekly averages, streaks. Every claim about them needs the visual form settled
first: a claim about a heat map and a claim about a line chart are not the same claim, and
writing one now would mean rewriting it later.

`root/streak/*` will belong with A001's claims rather than here, since a streak is arithmetic
over `answered_at` and needs no page to be judged. Move it when F7 clears.

## Not claimed

- **The dashboard is SvelteKit.** Rationale territory at most. Nothing drifts from a framework
  choice by accident in a two-page application, and a lint witness for it would cost more than
  the risk.
- **The Access session lasts 30 days.** A setting whose failure mode is annoyance. If a short
  session makes the dashboard unpleasant you will stop opening it, and no witness recovers that.

# A003 — the dashboard

**Project**: `dashboard` (`apps/dashboard`) · **Status**: proposed · **Gated by**: A001, F7

SvelteKit on `adapter-cloudflare`, bound to the same D1 database, behind Access.

## Add

### `dashboard/never-writes`

**Kind**: capability
**Claim**: The dashboard cannot write to the database.
**Witness**: **type** — the dashboard receives a handle whose interface exposes no write
operation. There is no method to call.

This is the one claim in the project worth arguing about, because the obvious witnesses are both
worse:

- A **test** asserting that no write happens proves it about the paths the test walks, and a
  page added next month is not one of them.
- A **lint rule** banning write methods inside `apps/dashboard` is a rule about spelling. It
  catches `db.prepare("INSERT …")` only if it recognises the string.

A type that has no write method makes the write unrepresentable, and it is the highest rung the
ladder offers. It also costs almost nothing: the interface is a few lines, and the read-only
handle is what the dashboard wanted to be given anyway.

`ABSTRACT.md` stated this as "the dashboard reads data only. It writes no data" — a sentence
about intent. Assigning a witness turned it into a decision about who hands the dashboard its
database handle, which is a design decision that would otherwise have been made by accident.

### `dashboard/shows-the-history`

**Kind**: capability
**Claim**: The dashboard shows every entry, most recent first, with its three measures and its
note.
**Witness**: witness file — `@scope apps/dashboard/**`, with a judgment a reader applies against
a fixture.

Kind 4, honestly. "Shows the history" is a claim about a rendered page, and a test that asserts
the presence of table rows attests something narrower than the claim says — which is exactly the
condition an audit is supposed to catch.

### Statistics — **blocked**

**Blocked by**: F7.

Trend lines, weekly averages, streaks. Every claim about them needs the visual form settled
first: a claim about a heat map and a claim about a line chart are not the same claim, and
writing one now would mean rewriting it later.

`core/streak/*` will belong in A001's project rather than here, since a streak is arithmetic over
`answered_at` and needs no page to be judged. Move it when F7 clears.

## Not claimed

- **The dashboard is SvelteKit.** Rationale territory at most. Nothing drifts from a framework
  choice by accident in a two-page application, and a lint witness for it would cost more than
  the risk.
- **The Access session lasts 30 days.** A setting whose failure mode is annoyance. If a short
  session makes the dashboard unpleasant you will stop opening it, and no witness recovers that.

# A006 — the declared infrastructure

**Project**: `root` · **Packages**: the repository root, `apps/checkin`, `apps/dashboard` ·
**Status**: proposed · **Gated by**: the Alchemy
adoption and its spike ([`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md) §7)

The claims F10 deleted, plus two it never reached. Every one is a claim about what the repository
**declares**, and not one of them is a claim about what the account contains.

## F10 is refined, not reopened

F10 asked whether the infrastructure claims belong in the catalog and answered **no**, because
their state was not rederivable from a checkout. The answer stands for the question as asked. The
question conflated two things:

> **A claim about _live_ infrastructure still does not belong in the catalog. A claim about
> _declared_ infrastructure does.**

With no IaC there was no declaration to make a claim about, so the distinction had nothing to
attach to and F10 could not have drawn it. What it recorded as a principle was a property of the
tooling.

**And the claims were not strictly impossible before — they were badly witnessed.** The witness
available in 2026 was a person reading a CI deploy script and judging what it would produce. That
is kind 4 twice over: prose judging prose, where the thing being read is not even the subject. The
deeper defect is that **an imperative script cannot be read for its resulting state.** You would
have to simulate it. A declarative artifact can be read for exactly that, which is what makes a
static witness possible at all, and it is why the same promises now sit at rungs 1 and 2 rather
than at the bottom of the ladder.

That is the general form and it is worth recording as such: the §4.1 boundary is not fixed, and
what moves it is whether your infrastructure has a declarative form inside the checkout.

## The shape every witness here takes

Two facts from the Alchemy research constrain all of it.

**A `Stack` cannot be enumerated without running it.** Resources are `yield*`ed inside
`Effect.gen`, so listing what a stack declares means interpreting it, and interpreting it needs the
provider layer.

**Access applications, policies, and DNS records have no local emulation.** Alchemy emulates
Workers, D1, R2, KV and Queues; the local-development page is explicit that a resource whose
provider has no local implementation deploys to the real cloud. So a `Test.make({ dev: true })`
test that deployed and asserted would **create a real Access application**, which is both a
side effect and a §4.1 violation.

The repair is a layout rule, and it is the single design decision this amendment makes:

> **Declarative values live in plain modules, not inside the `Effect.gen`.** Each stack gets an
> `src/infra.ts` of ordinary exported data; `alchemy.run.ts` consumes it and adds nothing of its
> own that a claim depends on.

A witness then imports `infra.ts` and reads it — no providers, no emulation, no credentials, and
the subject is a declarative artifact in the repository. That is what buys rungs 1 and 2 for
resources that can never be run locally.

**The check-in rate limiter is the exception, and the contrast is instructive.** It is a Worker
binding, so it emulates, so it gets a real runner and a real behavioural witness. Zone and Zero
Trust configuration gets a reading witness. The ladder's ceiling is set by the ecosystem, and here
the ecosystem sets two different ceilings inside one amendment.

## A note on `root`, and on where the zone lives

[`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md) §2 proposes three stacks — `core`, `checkin`,
`dashboard`. The zone and its DNS records belong to none of them: both hostnames live in one zone,
and the apex records concern mail that has nothing to do with this project.

**So a fourth stack, `alchemy.run.ts` at the repository root, holds the zone and its records**, and
this amendment adjusts the plan accordingly.

`root` is no longer the prefix of a root project among several — it is the prefix of the only
project, since [`ONE-PROJECT.md`](../ONE-PROJECT.md) landed. What survives that collapse is the
placement question, which is about the `<path>` segment: `dns` belongs to no package, so the
claim below is the first one whose subject is the repository itself rather than something under
`packages/` or `apps/`.

[C11](../CRUX-FEEDBACK.md) predicted the root would hold mostly `@kind development` claims and was
careful to call that a correlation rather than an identity. This is the counter-example arriving
from the direction C11 left open: `root/dns/apex-mail-is-declared` is a capability claim about the
repository itself, because the zone is a capability of the repository and of no package in it.

## Add

### `root/dashboard/is-behind-access`

**Kind**: capability
**Claim**: The dashboard is served only behind an Access application. The application's domain is
the same configured value the site is served on, and its policy admits a single identity.

**Witnesses** — three:

| Kind | Attests                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| type | the site's domain and the Access application's domain are one configured value, used twice, so they cannot diverge                         |
| test | over `apps/dashboard/src/infra.ts`: the declared policy decides `allow`, carries exactly one `include`, and carries no rule that widens it |
| lint | a hostname-shaped literal is denied under `apps/dashboard/**`                                                                              |

**Coverage.** Three ways this stops protecting anything. The type closes the quietest one: Access
guarding a hostname the site no longer serves, where both resources exist, both look right, and
the dashboard is open. The test closes the policy being widened later — a second `include`, an
`everyone` rule — which is the change somebody makes while debugging their own access. The lint
closes the value being pasted in as a literal, which would defeat the type witness by
reintroducing the second source it exists to prevent.

This is the claim that carries the weight A003 left with the runbook. It is also the one whose
witnesses are furthest from the thing a reader cares about, which is why the next section is
written as plainly as it is.

### `root/checkin/email/destination-is-pinned`

**Kind**: capability
**Claim**: The send binding pins one destination address, and that address is the same configured
value declared as the zone's routing destination.

**Witnesses** — three:

| Kind | Attests                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| type | `SendEmail`'s `destinationAddress` takes one value, not a list                                                                             |
| test | over `apps/checkin/src/infra.ts`: the send binding's destination and the declared `Cloudflare.Email.Address` are the same configured value |
| lint | an email-shaped literal is denied under `apps/checkin/**`                                                                                  |

**Coverage.** The failure a reader sees is that the daily mail goes somewhere else, or nowhere. The
type closes the fan-out case. The test closes the divergence case — a send binding pinned to one
address while the zone forwards a different one, which is two correct-looking declarations and no
mail. The lint is A002's existing marker, which now carries a second `@attests`; §5.7 permits that
because each claim keeps a witness that attests it alone.

**This is the half of A002's first draft that §4.1 cut.** Draft 1 read "the recipient is a
**verified** destination address" and lost its second clause because verification happened in a
dashboard. `Cloudflare.Email.Address("Inbox", { email })` declares the destination, so the
declaration is claimable now. **Verification is not** — a human still clicks a link in an
email, and no witness here observes whether they did. What returns is smaller than what was cut,
and it is not nothing.

### `root/dns/apex-mail-is-declared`

**Kind**: capability
**Claim**: The zone's apex MX records are declared in the repository, alongside the records the
mail subdomain needs.

**Witnesses** — two:

| Kind | Attests                                                                                 |
| ---- | --------------------------------------------------------------------------------------- |
| test | the declared record set contains the apex MX records                                    |
| lint | a DNS record may be declared only in the root stack's `src/infra.ts`                    |
| type | MX records are declared through a helper whose parameter type makes `priority` required |

**Coverage.** One failure, and it is the largest in this amendment: your personal email stops
arriving. The test closes the case where the apex records are absent from the declaration, which is
what makes their removal a visible diff rather than a silent one. The lint closes a second
declaration site, because two modules declaring records for one zone is how one of them wins
without anybody choosing. The type closes an MX record declared without a priority — Alchemy types
the field optional though the API requires it for exactly this record type, so the deploy fails
where a compile should have. A one-line wrapper moves it to kind 1; see the note below.

**This claim is modest and should not be oversold.** It does not promise the records exist in
Cloudflare, and nothing here detects a change made in the dashboard. What it promises is that the
repository knows about them — which is the precondition for a plan showing their deletion, and
F2's whole worry is a deletion nobody sees. The claim is the precondition, not the protection.

**MX support is confirmed, and this paragraph used to say the opposite.** The earlier draft called
it unverified on the ground that the documented examples are `A` and `CNAME` only. Reading
`Cloudflare/DNS/Record.ts` settles it: `"MX"` is in the record-type union, and `priority` is
threaded through both the create and the update paths.
[`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md) risk 4 had already recorded this and the two
documents disagreed until now — the migration document had the receipts, and this one was stale.

**What the reading found instead is a trap, and it earns the third witness above.** `priority` is
documented as _"required for `MX` and `URI` records"_ and typed `priority?: number`. So an MX
record declared with no priority type-checks, and the failure surfaces at the API rather than at
`vp check`. Since the failing case is a mail record, the failure mode is your mail — which is what
makes it worth closing structurally rather than remembering.

### `root/checkin/form/consults-a-rate-limiter`

**Kind**: capability
**Claim**: The form's POST path consults a rate limiter before recording, and refuses without
writing when the limiter denies.

**Witnesses** — three:

| Kind | Attests                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| type | the POST handler's requirement channel includes the rate-limit service, so a path that skips it does not type-check |
| test | under local emulation: exceed the budget, assert the request is refused **and** no entry was written                |
| test | within budget, the request records                                                                                  |

**Coverage.** The §5.8 pair, with the refusal's side effect proved separately. The type closes a
POST path that never consults the limiter. The first test closes the limiter being consulted and
its answer ignored, and it checks the refusal wrote nothing — crux's adversarial rule, and the
failure that would otherwise let a flood through one row at a time. The second test is the positive
polarity: a limiter that denies everything passes the first two witnesses and breaks the product.

**This claim changed mechanism, not just witness.** F10's version was a zone-level WAF
rate-limiting rule. Alchemy's rate limiting is a **Worker binding** — a counter the handler
consults per request. That is a different thing, and it is the better claim: it is on the request
path, it is expressed in the code that uses it, and it emulates locally, so it is the one claim
here with a behavioural witness rather than a reading one. The WAF rule was none of the three.

The binding's counting is documented as "approximate and local", suited to "cheap, fast abuse
protection" and not to globally consistent quotas. The claim says _consults a rate limiter_, not
_enforces a global budget_, and that wording is deliberate — §5.8's second repair, applied at
authoring time rather than after an audit.

## What this amendment does not claim

- **That the account matches the declaration.** Drift is monitoring. Somebody clicks in the
  Cloudflare dashboard, the repository is unchanged, and every witness here stays green. This is
  the residue of C1 and it does not go away; what changes is that the declaration is now a real
  artifact to diff against, where before there was nothing on the repository side at all.
- **That the destination address is verified.** A human clicks a link in an email. See above.
- **That the Access session is short enough.** `sessionDuration` is a field on
  `Access.Application`, so A003's "not claimed" entry is no longer impossible — only still a
  judgment. A003 filed it under annoyance; the counter-argument is that a long session is a
  security matter and not an annoyance one. Unresolved, and deliberately left out rather than
  smuggled in.
- **That `alchemy plan` says what we expect.** `plan` reads the state store, and the state store
  is remote unless configured otherwise. A witness built on it would not be rederivable from a
  clean checkout. Every witness above reads a plain module instead.

## The work

1. Adopt Alchemy through Phase 4 of [`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md).
2. Add the fourth stack at the repository root for the zone and its records. The root
   [`GLOSSARY.md`](../../GLOSSARY.md) already declares `@project root`, and since
   [`ONE-PROJECT.md`](../ONE-PROJECT.md) landed it is the only `@project` in the repository, so
   there is no glossary work left for this amendment to do.
3. Hoist declarative values into `src/infra.ts` in each stack's package. This is the step every
   witness depends on; do it before writing any of them.
4. Write the four claims' witnesses, one custom lint rule per claim that names one
   (`no-restricted-syntax` over an identifier, never over a string).
5. `vp run ready` from a clean checkout **with every `CLOUDFLARE_*` variable unset**. If that
   fails, the migration's spike was answered wrong and this amendment stops.
6. Audit claim by claim. Set coverage for all four.

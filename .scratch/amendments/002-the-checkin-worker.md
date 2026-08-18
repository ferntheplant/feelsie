# A002 — the check-in Worker

**Project**: `root` · **Package**: `apps/checkin` · **Status**: enacted · **Gated by**: A001

The cron trigger, the form, and the outbound mail. A thin shell over `core`: everything here
needs a Worker to judge, and nothing here should need more than that.

## Enacted, then revised by an independent audit and a second ruling

Every claim below landed. The catalog entries are in
[`docs/catalog/checkin.md`](../../docs/catalog/checkin.md). Two of the six were reworded during
the build, then two changed again after the independent audit. This section records why —
crux §7 asks for exactly this, and "an amendment that had to change during the build" is on the
dogfooding watch list.

**`is-sent-at-the-send-hour` was self-contradictory against `records-a-failed-send`, and only
the operator could settle it.** The first claim said the prompt is sent at the send hour "and at
no other hour"; the second's witness said a failed send leaves the prompt unmarked so that "the
next fire tries again", and its coverage note spoke of suppressing "every retry **for that local
date**". Under a strict hourly gate there is no such retry: the cron fires once per hour, so the
next fire that reaches the send path is tomorrow's, on a new local date and a new prompt. The two
readings produce different code and different witnesses, so the specification was not changed on
the builder's authority.

> **The ruling: retry until the local date ends.** The gate is _the local hour is at or after
> the send hour, and today's prompt is unsent_. A 21:00 failure retries at 22:00 and 23:00. The
> mail arriving an hour late beats a transient blip costing the whole day's entry, and it still
> cannot arrive early, which is the failure a reader would actually see.

The claim now reads: _A prompt is sent at the configured send hour, and never before it. It is
sent at a later hour of the same local date only when an earlier send failed._ The witness set
gained one for the half the rewording introduced — see below.

**`is-sent-once-per-local-date` says "returns" rather than "occurs".** With retries in the
picture, "at most one send occurs" is ambiguous in the one case that matters: three attempts and
one delivery is either one send or three, depending on the reader. It now says _at most one send
**returns**_, which is also the only thing a witness can observe.

**The independent audit found that both send claims still promised more than the primitives can
guarantee.** D1 cannot share a transaction with the email binding, and the binding accepts no
idempotency key. A lease can serialize attempts, but a crash after email acceptance and before
the success write remains ambiguous. The next fire must choose between a duplicate and no retry.

The send-hour wording also still used **sent** where its witnesses observed **attempted**. Under
the glossary, a refused send was never sent at the configured hour. The all-day refusal witness
observed zero sends and therefore did not support the claim it named.

> **The second ruling: use an at-least-once model.** Every attempt for one local date reuses one
> prompt. Attempts begin on the first scheduled fire at or after the send hour. Failed attempts
> retry hourly. Once a returned send is recorded, later fires stop.

The two old slugs named promises the repository no longer makes. They became
`reuses-one-prompt-until-success` and `attempts-start-at-the-send-hour`. The rationale now records
the unavoidable duplicate window rather than presenting write-then-send as exactly once.

**F1 cleared, and it changed the witnesses rather than the claims.** `send_email` does work
inside a `scheduled` handler — one Worker holds both the cron trigger and the send binding, and
the reserve correction (move the send to a `fetch` route) is not needed. What the spike found on
the way is in the next section, and it is the reason two witness sets below are not what they
were. See [`prototypes/cron-send-email-spike/`](../../prototypes/cron-send-email-spike/) and
[F1](../fog.md#f1--does-send_email-work-inside-a-scheduled-handler--cleared-by-evidence).

## A failing send is silent, and every witness here has to assume it

`CronEventSourceLive` wraps every handler in `Effect.catchCause(() => Effect.void)`. Alchemy
documents this — a failing handler will not crash the Worker, so Cloudflare never observes a
failed invocation, its retry never engages, and `controller.noRetry()` is moot. The spike watched
a refused send return `{"outcome":"ok"}` with HTTP 200.

Three consequences, and they are load-bearing for everything below:

- **A witness that observes the invocation attests nothing.** "The scheduled fire completed" is
  true when the send threw. Every witness in this amendment observes the send, the prompt row, or
  the recorded outcome — never the fire.
- **The handler must make its own failure visible**, because the event source will not. That is
  a `root/checkin/prompt/records-a-failed-send` shaped promise, and it is added below.
- **`Effect.retry` is the retry control**, not the platform's. A transient send failure is
  retried inside the handler or it is not retried at all.

  > **This bullet is the one the build corrected.** It is true that the platform will not retry,
  > and false that the handler's own invocation is the only place a retry can live: the cron
  > fires hourly, so the **next fire** is a retry if the gate lets it through. The operator's
  > ruling (see the top of this file) makes the gate let it through for the rest of the local
  > date, so no `Effect.retry` was written. A second retry mechanism inside the invocation would
  > have needed its own witness and would have bought seconds where the schedule buys hours.

The failure this prevents is the quietest one in the system: the daily mail stops, and every
signal a platform offers reads normal — including the one
[`docs/gotchas.md`](../../docs/gotchas.md) already says not to trust.

## Revised after A005

This amendment was written before crux had §5.8 (coverage) or §5.9 (group by the failure a reader
can see). Its fingerprint was the one A005 corrected in `core`: **every add named exactly one
witness**, which is the shape the retracted rule produced.

Nothing here was regrouped — the six claims were already at reader-visible altitude, which is
worth noting, because the altitude error in `core` came from splitting under audit pressure and
these claims never reached an audit. What changed is the witness side. Every add now names a set
and argues its coverage, and three of the five gained a witness of the opposite polarity that
§5.8 says to check for first.

Two slugs were renamed. `checkin/exposes-no-history` gained the area segment every other slug
carries, and `checkin/email/addresses-are-never-literal` named the prohibition half of a claim
that promises the mechanism. Both are cheap now and permanent later.

## The seam this amendment needs

Two claims below take a **type** witness, and neither is representable against `core` as it
stands. `DatabaseShape` exposes `first(statement)` and `batch(statements)`, both taking arbitrary
SQL. Narrowing a handle to `first` does not make a write unrepresentable: `first` runs
`raw.prepare(text).get(...)` ([`test-support/sqlite.ts:29`](../../packages/core/src/test-support/sqlite.ts)),
so `INSERT … RETURNING` writes and returns its row. D1's `.first()` behaves the same way.

So `core` stops handing one `Database` service to everything and exposes narrow capability
services instead. The public form receives `CheckInFormRead`: one token in, and only its prompt
and entry out. A handler typed with that requirement cannot call a write or choose a local date.

**That seam carries no claim of its own.** Nothing about it is falsifiable that the claims below
do not already say, so it is production work rather than an amendment, and it lands in whichever
of A002 and A003 merges first. The other inherits it.

**It landed here.** `packages/core/src/capabilities.ts` splits by caller rather than by table.
`core.ts` keeps every statement and is exported from nowhere. `Database` and the SQL types moved
to `@feelsie/core/database`, which gives the lint rule an entrypoint to deny. `@feelsie/core/d1`
hands this Worker only `CheckInFormRead`, `CheckIn`, and `PromptWrite`; it receives no date-based
entry reader and never names the raw service.

**D1 retries live inside that adapter.** Cloudflare documents transient failures for reads and
writes. Retrying the whole check-in operation would repeat its clock and expiry decisions, so the
adapter retries documented transient D1 failures twice with exponential backoff. Migration `0003`
adds an attempt ID, backfills existing rows from their primary keys, and indexes it uniquely. One
send attempt keeps one UUID through an unknown committed insert and its retry; separate attempts
remain separate even when their timestamps match.

Two consequences A003 inherits, neither of them predicted here:

- **`core`'s existing witnesses were rewritten**, because the free functions they called are no
  longer exported. Not one claim changed; every one of them now goes through the same services an
  app holds, which is strictly closer to the production path than it was. Two were added for
  `root/prompt/expires-after-seven-days`: one distinguishes creation time from send time, one
  proves that `sent_at` records the return time, and one checks the GET boundary independently.
- **The package's `exports` point at source rather than at `dist`.** `vp run ready` runs
  `check → test → build` in that order, so on a clean checkout `apps/checkin`'s tests execute
  before `packages/core` has been built. A `dist` entrypoint would make the gate's own ordering
  the thing that fails. The `build` script stays as a check that the package packs; nothing
  consumes its output.

**The independent audit strengthened two rewritten Core witnesses.** The token-survival test now
reuses an already-used token one millisecond before expiry. The last-write test now observes the
first stored entry before replacing it. Both tests previously reached the ordinary path without
reaching the full wording of their claims.

## Add

### `root/checkin/form/get-does-not-write`

**Kind**: capability
**Claim**: A GET to a prompt link never writes. Only POST records measures.

**Witnesses** — four:

| Kind | Attests                                                                              |
| ---- | ------------------------------------------------------------------------------------ |
| type | the GET handler receives one token-authorized read and no write operation            |
| test | GET the link, then assert the database's total write count did not change            |
| test | POST on the production path records the measures                                     |
| test | the same GET-then-POST round trip against the deployed Worker over a live D1 binding |

**How the type witness is spelled.** `getForm` carries an explicit
`Effect<HttpServerResponse, never, CheckInFormRead | HttpServerRequest>` annotation, and
`routes.test.ts` pins it with `expectTypeOf`. Reaching a named write puts `CheckIn` in the union
and the annotation becomes a compile error.

**The fourth witness was added during the build**, for the reason the fourth one in
`reuses-one-prompt-until-success` was: the other instruments judge the handler type or run handler
values against `node:sqlite`, so they do not attest the deployed Worker.

**Coverage.** The type closes named write operations. It cannot prove that a read operation's
implementation contains no SQL write. The GET test compares SQLite's connection-wide
`total_changes()` before and after repeated GETs, so any table write fails it, including writes to
tables added later. The deployed round trip then closes the Worker wiring gap.
The POST test is the positive-polarity witness §5.8 asks for, and it is not optional here — a
Worker that records on **neither** verb passes the first two witnesses cleanly, and the claim's
second sentence is what it violates.

The type witness is A003's technique, mirrored. That amendment found it for `root/dashboard/never-writes`
and this one asked for a test, which is the ordinary result of two amendments written in one
sitting and never read against each other.

The highest-value claim in the project, and the failure it prevents is not a security one. Mail
scanners and link-preview tools open the links in your inbox before you do. A GET that wrote
would mean some days were answered — with whatever the defaults are — before you ever touched
the email, and you would never see it happen.

### `root/checkin/prompt/reuses-one-prompt-until-success`

**Kind**: capability
**Claim**: Every send attempt for a local date uses one prompt. Once a returned send is recorded,
later scheduled fires make no further attempts.

**Witnesses** — four:

| Kind | Attests                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------- |
| test | run the handler _n_ times after success is recorded; one prompt and no later attempt              |
| test | run the handler at all 24 hours of a simulated local day; one prompt and no attempt after success |
| test | fail once and retry on the next fire; both attempts carry the same token                          |
| test | fire the deployed Worker's schedule twice; one message on the local email simulator's disk        |

**Coverage.** The fixed-hour and full-day tests show that a recorded success stops same-hour and
later-hour fires. The failure-then-success test observes the token on both attempts, which reaches
the reuse half. The deployed test observes the production binding rather than an invocation.

**The fourth was added during the build**, and it is the only one that runs the real Worker. The
first two provide a recording `Mailer` in place of the send binding, so they attest the handler
and say nothing about whether the deployed Worker hands that handler a real binding — the
production-path gap [C19](../CRUX-FEEDBACK.md) found twice in `core`. It fires
`/cdn-cgi/handler/scheduled` against a Worker running in workerd and counts files the local email
simulator wrote after validating them.

**A send is counted at the binding, not at the fire.** Counting completed invocations passes with
zero sends because the event source reports a thrown send as a successful fire.

**What it does not promise.** It does not promise exactly-once delivery. A send can return and its
success write can fail. The next fire then retries because no repository state can distinguish
that case from a send that never returned.

### `root/checkin/prompt/attempts-start-at-the-send-hour`

**Kind**: capability
**Claim**: The first scheduled fire at or after the configured send hour attempts the prompt, and
no earlier fire does. Failed attempts retry on later fires until one returns or the local date
ends.

**Witnesses** — six:

| Kind | Attests                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------- |
| test | run the handler at all 24 hours of a simulated local day; the first attempt is at the send hour |
| test | change the configured send hour; the first attempt follows it                                   |
| test | first fire after the exact hour; it attempts immediately                                        |
| test | fail at the send hour; the next hourly fire retries                                             |
| test | refuse for a full day; attempts occur at 21, 22, and 23 only                                    |
| test | the deployed Worker's schedule reaches the send binding through the production mount            |

**Coverage.** The first two reach the ordinary and configured-hour paths. The late-first-fire test
distinguishes _at or after_ from exact equality. The failure-then-success test reaches a useful
retry, and the all-day refusal records the exact admitted hours rather than only their count.
The deployed witness connects those handler properties to the mounted schedule.

F4 cleared, and cleared into a better claim than the one it was blocking. The draft was waiting
on a number — "the prompt is sent at 21:00" — and the answer was that 21:00 is a _default_, with
the hour and the zone both configurable. So the claim never mentions 21:00 at all.

### `root/checkin/prompt/records-a-failed-send`

**Kind**: capability
**Claim**: When a send fails, the handler records the failure and does not mark the prompt sent.
A prompt marked sent is one whose send returned.

**Witnesses** — three:

| Kind | Attests                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| test | pass `SendEmailError` through the production mail adapter; its reason is recorded             |
| test | force the binding to refuse; the prompt is **not** marked sent, and the next fire tries again |
| test | a send that returns records no failure and marks the prompt sent                              |

**Coverage.** The first witness uses the same adapter the Worker mounts, so it covers the mapping
from Alchemy's `SendEmailError` into the handler and observes the failure record. The second
observes that a failure leaves the prompt unsent; its retry assertions also attest the two send
protocol claims. The third is the opposite polarity: a successful send records no failure and
marks the prompt sent. The deployed success witness separately proves that the real binding enters
through this adapter.

**This claim exists because of F1's spike and would not otherwise have been written.** The event
source swallows the handler's failure, so nothing outside the handler can observe a bad send —
not the invocation outcome, not the platform's retry, not the metric `docs/gotchas.md` warns
about. Recording it inside the handler is the only place the observation can happen, which makes
it a property of this Worker rather than of monitoring, and therefore claimable.

**What it deliberately does not promise.** That anybody reads the record. Alerting on it is
monitoring, it is not rederivable from a checkout, and F10's line holds. What is claimable is
that the information exists at all, which is the precondition — the same shape as
`root/dns/apex-mail-is-declared` in A006.

### `root/checkin/routes/expose-no-history`

**Kind**: capability
**Claim**: The check-in Worker serves no route that returns any entry other than the one the
presented token authorises.

**Witnesses** — five:

| Kind | Attests                                                                              |
| ---- | ------------------------------------------------------------------------------------ |
| type | the Worker's read accepts one token and returns only its prompt and authorized entry |
| lint | direct D1 query clients and every history or date-based entry-read import are denied |
| test | enumerate the Worker's routes; the set is exactly the expected one                   |
| test | the route returns only the entry the presented token authorizes                      |
| test | the deployed Worker serves the same form and rejects a stray route                   |

**The type witness changed after the independent audit.** `EntryRead.forDate` prevented a list
operation and still let a route loop over dates. `CheckInFormRead.forToken` now makes the token the
only input and returns its prompt plus its authorized entry. The Worker receives no date-based
entry reader from the D1 adapter.

**The lint witness could not deny the entrypoint the amendment named, because A003 has not
created it.** The description says _`no-restricted-imports` denying the entrypoint that carries
the list operation_. There is no such entrypoint today: `core` exports `readEntry` from the same
place it exports everything else, and inventing an empty `@feelsie/core/history` for a lint rule
to point at would have been dead code with no consumer. What landed instead denies three things
under `apps/checkin/**`:

- **`@feelsie/core/database`** — the entrypoint that carries the SQL interface, which is how a
  multi-entry read is expressible **today**. The seam moved `Database` off the package index for
  exactly this.
- **the names `EntryRead`, `EntryHistory`, and `listEntries` from `@feelsie/core`** — an
  `importNames` deny that holds the token-authorized interface in place across A003's addition.
- **the D1 query constructors and `WorkerEnvironment` from `alchemy/Cloudflare`** — a custom
  identifier rule closes direct-client and raw-binding bypasses through the infrastructure package
  that the Worker legitimately imports.

All three were verified by writing the forbidden access and watching the linter refuse it.

**Carrying the base configuration's `patterns` into the override was load-bearing and nearly
missed.** Oxlint replaces a rule's options in an override rather than merging them, so the
override would have silently re-permitted `../**` imports inside `apps/checkin` alone — the one
package where nobody would think to check. Caught by writing a parent import and finding it
allowed.

**Coverage.** The type closes listing and date iteration through the capability the Worker
receives. The lint closes Core and Alchemy bypasses. The route enumeration catches a route added
to the table, and the response test observes the authorized result. The deployed test connects
those properties to the production entrypoint.

An earlier draft named the enumeration test alone. It is sound — it removes a real way to fail —
and it observes only which routes _exist_, where the claim is about what a route _returns_. That
is §5.8's ordinary gap, and it mattered more here than anywhere else in the amendment, because
this claim carries the weight the missing Access application would have carried.

**A lint rule barring `SELECT` from the entry tables was considered and does not land.** There is
no SQL in `apps/checkin` to match — every statement is built inside `packages/core/src/core.ts`,
and the Worker only calls named operations. Scoped to `packages/core/**` instead, such a rule
would fire on the dashboard's legitimate list query. The rule that works is aimed at an import
specifier rather than a SQL string, which is the same distinction that sank the lint witness for
`root/dashboard/never-writes`: an identifier rule is exact, a string rule is about spelling.

The check-in hostname is deliberately open ([`two-hostnames.md`](../../docs/rationale/two-hostnames.md)).
Renamed from `checkin/exposes-no-history` for the missing area segment.

### `root/checkin/email/sender-follows-the-configured-domain`

**Kind**: capability
**Claim**: Every address the Worker sends from is constructed from the configured mail domain.
No email address appears as a literal anywhere in the Worker.

**Witnesses** — three:

| Kind | Attests                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| lint | an email-shaped string literal is denied under `apps/checkin/**`                               |
| test | change the configured mail domain; the address the Worker **sends from** follows               |
| test | the deployed Worker's send is accepted by a binding whose allow-list is the configured address |

**The lint witness needed a rule that does not exist, so one was written.** Oxlint 1.77.0 ships
no `no-restricted-syntax`; every built-in restriction rule keys on an identifier
(`no-restricted-imports`, `no-restricted-properties`, `no-restricted-globals`) and none of them
can see a string. The ceiling for this witness was therefore either kind 3 via Oxlint's
JS-plugin API or kind 2 via a test that greps the source. The plugin exists at
[`tools/lint/plugin.ts`](../../tools/lint/plugin.ts), it denies both string literals and the
fixed parts of template literals, and it is off for the test files — the positive-polarity
witness has to write an address down, and a test is not code that ships in the Worker. A006
already plans more custom rules, so this is the first tenant of a building that was going to be
built anyway. Recorded as [C28](../CRUX-FEEDBACK.md).

**The third witness is the production-path half, and it is nearly free.** The send binding's
`allowedSenderAddresses` is built at plan time from the same configured value the handler sends
from, so the local simulator — which validates the allow-list exactly as Miniflare does — refuses
and writes nothing when the two disagree. A `prompt@…` pasted in as a literal produces no message
on disk. It is the same emulation test that counts the send for
`reuses-one-prompt-until-success`, carrying a second `@attests`; §5.7 permits that because each claim
keeps a witness attesting it alone.

**Coverage.** The pair §5.8 describes exactly: a prohibition and its positive complement. The
lint removes the way to fail — a hardcoded `checkin@mail.example.com` pasted in while debugging
and never removed. The test supplies the observation the lint cannot make, that the production
path reads the configured value. Neither alone: a Worker that sends from no address at all passes
the lint.

**The test observes the send, not `senderAddress`.** A test that exercises `core`'s
`senderAddress` in isolation attests `core`, not this Worker, and leaves the connection between
them unwitnessed. That is the production-path gap A005's second coverage audit found twice in
`core` ([C19](../CRUX-FEEDBACK.md)), and it is cheaper to avoid here than to find later.

This claim was rewritten twice before either §5.8 or §5.9 existed, and both rewrites were forced
by rules rather than by taste. It is worth keeping the trail, because the end state is much
stronger than the start and nobody chose it directly.

**Draft 1**: "the sending address is on the onboarded subdomain, and the recipient is a
**verified** destination address." Cut in half by the rule that a claim must be rederivable from
a checkout — whether Cloudflare verified a recipient happened in a dashboard. That half is now a
step in [the runbook](../../docs/runbooks/onboard-the-mail-subdomain.md).

**Draft 2**: "every address the Worker sends from is on the mail subdomain." Killed by this being
a public repository: the domain is a secret, so no checkout holds the value to compare against.

**What survived** is a claim about the mechanism instead of the value, and it catches the failure
that would actually occur. The two earlier drafts only ever checked one string. See
[C14](../CRUX-FEEDBACK.md).

Renamed from `checkin/email/addresses-are-never-literal`. The old slug named the lint rule's half
of a claim that promises the mechanism — a small instance of what §5.9 calls a witness taking a
claim's name, surviving in the slug after the prose had been fixed.

## Not claimed

- **The prompt is delivered by email.** Construction. Grounded by
  [`the-prompt-carries-a-link.md`](../../docs/rationale/the-prompt-carries-a-link.md), which
  grounds no claim on purpose — nothing can drift from a link back into a MIME parser.
- **The Worker is on the Paid plan.** A billing fact, not a promise of the codebase.
  [`docs/gotchas.md`](../../docs/gotchas.md).
- **The check-in hostname carries no Access application.** Not rederivable from a checkout, so
  it is not a claim — see [`CRUX-FEEDBACK.md` C1](../CRUX-FEEDBACK.md). This is the one deletion
  that stings: protecting the check-in hostname by accident breaks every link already sitting in
  your inbox, and it breaks them silently, because the mail still arrives. It is a real risk with
  no home in the catalog. It goes in the runbook.

## Note on witnesses here

**Nothing in this amendment talks to Cloudflare**, which is what keeps these claims rederivable
from a checkout. The original text said the tests run under `wrangler dev` / miniflare with
`--local`; the Alchemy adoption removed that tool, and
[`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md) §5 flagged this sentence as one that had to be
rewritten because it is load-bearing for §4.1. Its replacement, confirmed by the build:

- **Most witnesses need no emulator at all.** They run the exported handler values —
  `sendDailyPrompt`, `getForm`, `postCheckIn` — against `node:sqlite` through `core`'s capability
  services, with `TestClock` for the schedule and a recording `Mailer` for the send. Every
  adversarial case lives here, because this is where a twenty-four-hour local day costs
  milliseconds.
- **The wiring witnesses use `Test.make({ dev: true })`.** Both stacks deploy into workerd inside
  the test process, D1 and the `send_email` binding are emulated locally, and the resource ids
  come back `dev:`-prefixed — the proof no cloud call ran. `vite.config.ts`'s `test.env` supplies
  placeholder credentials that are resolved and never used.

**The emulation test has to change the process working directory, and that is worth recording.**
`migrationsDir` is relative, deliberately ([`AGENTS.md`](../../AGENTS.md), "The working directory
is not cosmetic"), so it resolves against whoever runs the deploy. A real deploy pins that with
`vp exec -F @feelsie/core`; a test harness has no `-F`, so the test does `process.chdir` to
`packages/core` before deploying either stack. It is the same instruction in the only form
available, and it is why `.alchemy/local/` — including the email simulator's messages — lands
under `packages/core` during a check-in test run. Recorded as [C29](../CRUX-FEEDBACK.md).

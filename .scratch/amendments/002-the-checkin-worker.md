# A002 — the check-in Worker

**Project**: `root` · **Package**: `apps/checkin` · **Status**: enacted · **Gated by**: A001

The cron trigger, the form, and the outbound mail. A thin shell over `core`: everything here
needs a Worker to judge, and nothing here should need more than that.

## Enacted, and one claim was reworded on an operator's ruling

Every claim below landed. The catalog entries are in
[`docs/catalog/checkin.md`](../../docs/catalog/checkin.md). Two of the six were reworded during
the build, one of them by escalation, and this section is the record of what moved and why —
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

**Everything else about the claims survived unchanged**, including both slugs the pre-build
revision renamed.

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

Nothing here was regrouped — the five claims were already at reader-visible altitude, which is
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
services instead — the Effect requirement channel is the mechanism, and a handler typed
`Effect<Response, E, PromptRead>` cannot call an operation requiring `Database` without a type
error.

**That seam carries no claim of its own.** Nothing about it is falsifiable that the claims below
do not already say, so it is production work rather than an amendment, and it lands in whichever
of A002 and A003 merges first. The other inherits it.

**It landed here.** `packages/core/src/capabilities.ts` holds four services — `PromptRead`,
`PromptWrite`, `EntryRead`, `CheckIn` — split by caller rather than by table, since a service
nobody would hold alone buys no witness. `core.ts` keeps every statement and is exported from
nowhere; `Database` and the SQL types moved off the package index to `@feelsie/core/database`,
which is what gives the lint rule an entrypoint to deny. `@feelsie/core/d1` hands back a Layer of
capabilities rather than of `Database`, so an app never names the raw service even to build one.

Two consequences A003 inherits, neither of them predicted here:

- **`core`'s existing witnesses were rewritten**, because the free functions they called are no
  longer exported. Not one claim changed; every one of them now goes through the same services an
  app holds, which is strictly closer to the production path than it was. One was added:
  `root/prompt/expires-after-seven-days` says "seven days after its **send** time", and until the
  two timestamps came apart there was no case that could tell send time from creation time.
- **The package's `exports` point at source rather than at `dist`.** `vp run ready` runs
  `check → test → build` in that order, so on a clean checkout `apps/checkin`'s tests execute
  before `packages/core` has been built. A `dist` entrypoint would make the gate's own ordering
  the thing that fails. The `build` script stays as a check that the package packs; nothing
  consumes its output.

## Add

### `root/checkin/form/get-does-not-write`

**Kind**: capability
**Claim**: A GET to a prompt link never writes. Only POST records measures.

**Witnesses** — four:

| Kind | Attests                                                                              |
| ---- | ------------------------------------------------------------------------------------ |
| type | the GET handler's requirement channel admits no operation that writes                |
| test | GET the link, then assert no entry exists and `answered_at` is unset                 |
| test | POST on the production path records the measures                                     |
| test | the same GET-then-POST round trip against the deployed Worker over a live D1 binding |

**How the type witness is spelled.** `getForm` carries an explicit
`Effect<HttpServerResponse, never, EntryRead | HttpServerRequest | PromptRead>` annotation, and
`routes.test.ts` pins it with `expectTypeOf` — the same shape `root/config/is-required-and-valid`
already uses. Reaching a write puts `CheckIn` in the union and the annotation is where that
becomes a compile error; the Effect linter reports it a second time as
`missing-effect-context`. Verified by adding a write and watching both fire.

**The fourth witness was added during the build**, for the reason the third one in
`is-sent-once-per-local-date` was: the first three run the handler values directly against
`node:sqlite`, so they attest the handlers rather than the Worker.

**Coverage.** The type closes the way to fail where the GET path calls a write at all — a
violation is unrepresentable rather than caught. The GET test covers what the type cannot: a GET
route that redirects into the POST path, or one handed a writing service for an unrelated reason.
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

### `root/checkin/prompt/is-sent-once-per-local-date`

**Kind**: capability
**Claim**: However many times the scheduled handler runs, at most one prompt is created for a
local date, and at most one send returns for it.

**Witnesses** — three:

| Kind | Attests                                                                                     |
| ---- | ------------------------------------------------------------------------------------------- |
| test | run the handler _n_ times **at the send hour** with an injected clock; one prompt, one send |
| test | run the handler at all 24 hours of a simulated local day; one prompt, one send              |
| test | fire the deployed Worker's schedule twice; one message on the local email simulator's disk  |

**Coverage.** The first holds the hour fixed, which is what isolates idempotency from the
schedule: a handler that sends once only because one hour matched cannot pass it. The second adds
the case where the duplicate arrives from a _different_ hour rather than from a retry. The first
is this claim's solo witness (§5.7); the second is shared with the claim below.

**The third was added during the build**, and it is the only one that runs the real Worker. The
first two provide a recording `Mailer` in place of the send binding, so they attest the handler
and say nothing about whether the deployed Worker hands that handler a real binding — the
production-path gap [C19](../CRUX-FEEDBACK.md) found twice in `core`. It fires
`/cdn-cgi/handler/scheduled` against a Worker running in workerd and counts files the local email
simulator wrote after validating them.

**"One send" is counted at the binding, not at the fire.** Both witnesses assert against sends
observed on the `send_email` binding. Counting completed invocations instead would pass with zero
sends, because the event source reports a thrown send as a successful fire — see the section
above. This is the difference between a witness and a witness-shaped test, and F1's spike is what
made it visible.

The cron fires hourly by design, so this is not a defensive nicety — it is the property that
makes the schedule legal.

**Reworded to name the send.** The draft claimed only that the handler "creates at most one
prompt", while its witness asserted "exactly one prompt exists and exactly one send occurred" —
the witness reached further than the claim, which is the mismatch nothing looks for. Coverage
asks whether the witnesses reach the claim and has no question pointing the other way, so an
over-reaching witness is found only by reading the pair, which is what this revision did.

Renamed from `checkin/prompt/one-per-local-date`, which read against `root/entry/one-per-local-date`
in a catalog a human reads at the ruling. Different subjects, no form error, and two lines apart
on the page.

### `root/checkin/prompt/is-sent-at-the-send-hour`

**Kind**: capability
**Claim**: A prompt is sent at the configured send hour, and never before it. It is sent at a
later hour of the same local date only when an earlier send failed.

**Witnesses** — three:

| Kind | Attests                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| test | run the handler at all 24 hours of a simulated local day; one send, at the configured hour     |
| test | change the configured send hour; the send follows it                                           |
| test | the same full day with a mailer that refuses everything; three attempts, at 21, 22 and 23 only |

**Coverage.** The full-day run covers _the send hour, and no earlier_ on the ordinary path. The
configuration test is this claim's solo witness (§5.7), and it is also what keeps the claim about
the **configured** hour rather than about 21:00 — a handler with the fixture's hour hardcoded
passes the full-day run and fails this one.

**The third witness is what the operator's ruling made necessary**, and it is the more adversarial
of the three. With a working mailer the gate stops after the first send, so no test can tell _at
or after the send hour_ from _at the send hour exactly_ — the second clause of the claim is
invisible. A mailer that refuses everything keeps the prompt unsent all day, and the set of hours
the handler then attempts is the gate itself, read off directly. It is shared with
`records-a-failed-send`, where it covers the other half: the retry does not go quiet after one
attempt.

**§5.7 is why this pair was re-cut.** Both claims previously named the same test written twice:
_run the handler across one simulated local day, assert one send at the configured hour_. Every
claim needs at least one witness that attests it alone, or its verdict is coupled to another
claim's forever — and when a shared marker is the sole proof, the coupling is the signal that
either these are one claim or they lack real witnesses. They are two claims: they fail
separately, and a reader sees _24 emails today_ or _an email at 3am_, which are different things
to see. So the witnesses moved and the claims did not.

F4 cleared, and cleared into a better claim than the one it was blocking. The draft was waiting
on a number — "the prompt is sent at 21:00" — and the answer was that 21:00 is a _default_, with
the hour and the zone both configurable. So the claim never mentions 21:00 at all.

### `root/checkin/prompt/records-a-failed-send`

**Kind**: capability
**Claim**: When a send fails, the handler records the failure and does not mark the prompt sent.
A prompt marked sent is one whose send returned.

**Witnesses** — four:

| Kind | Attests                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| test | force the binding to refuse; the failure is recorded with its reason                          |
| test | force the binding to refuse; the prompt is **not** marked sent, and the next fire tries again |
| test | a send that returns records no failure and marks the prompt sent                              |
| test | refuse for a whole simulated local day; the handler is still trying at 23:00                  |

**The fourth is shared with `is-sent-at-the-send-hour`** and it covers a way the second can pass
while the claim is broken: a handler that retried exactly once and then went quiet leaves the
prompt unsent and satisfies both of the first two. Only running the whole day shows the retry
lasting as long as the local date does.

**Coverage.** The §5.8 pair, plus the half that makes the record trustworthy. The first two split
one failure into the two things a reader would notice separately: _nothing told me it broke_, and
_it broke and then gave up_. The second is the one that matters most, because a prompt wrongly
marked sent interacts with `root/checkin/prompt/is-sent-once-per-local-date` to suppress every
retry for that local date — a single transient failure would cost the whole day silently, which
is the failure the operator's ruling on the gate was made to avoid. The third is the opposite
polarity: a handler that records a failure on every run satisfies both
prohibitions and is useless, and nothing above would catch it.

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

**Witnesses** — four:

| Kind | Attests                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------ |
| type | no operation returning more than one entry is reachable from what `apps/checkin` imports               |
| lint | `no-restricted-imports` under `apps/checkin/**` denying the entrypoint that carries the list operation |
| test | enumerate the Worker's routes; the set is exactly the expected one                                     |
| test | the route that returns an entry returns only the entry the presented token authorises                  |

**Two of the four are spelled differently from the description above, and one of the differences
is a finding.**

**The type witness reads a service's shape, not a reachability graph.** "No operation returning
more than one entry is reachable from what `apps/checkin` imports" is not a thing a TypeScript
assertion can say. What it can say is that `EntryReadShape` — the entry-reading capability this
Worker is handed — is exactly one operation taking one local date and returning
`Option<EntryInput>`, asserted with `expectTypeOf(...).toEqualTypeOf`. That is narrower than the
sentence and it closes the same door: adding `listEntries` to the service `apps/checkin` receives
breaks the assertion, which is what forces A003's list operation onto a service this Worker never
gets. Verified by adding one and watching it fail.

**The lint witness could not deny the entrypoint the amendment named, because A003 has not
created it.** The description says _`no-restricted-imports` denying the entrypoint that carries
the list operation_. There is no such entrypoint today: `core` exports `readEntry` from the same
place it exports everything else, and inventing an empty `@feelsie/core/history` for a lint rule
to point at would have been dead code with no consumer. What landed instead denies two things
under `apps/checkin/**`:

- **`@feelsie/core/database`** — the entrypoint that carries the SQL interface, which is how a
  multi-entry read is expressible **today**. The seam moved `Database` off the package index for
  exactly this.
- **the names `EntryHistory` and `listEntries` from `@feelsie/core`** — an `importNames` deny,
  which is an identifier rule and therefore exact, and which is written before the names exist.
  That is the point: this rule's job is to hold the type witness in place across A003's addition,
  and a rule written afterwards is a rule written after the regression.

Both verified by writing the imports and watching the linter refuse them.

**Carrying the base configuration's `patterns` into the override was load-bearing and nearly
missed.** Oxlint replaces a rule's options in an override rather than merging them, so the
override would have silently re-permitted `../**` imports inside `apps/checkin` alone — the one
package where nobody would think to check. Caught by writing a parent import and finding it
allowed.

**Coverage.** Four ways this breaks, and no two witnesses reach the same one. The type
closes the direct path — today `core` exports `readEntry(date)` and nothing that lists, so the
claim is true by construction, and it stops being true the moment A003 adds `listEntries` to the
same entrypoint. The lint is what **holds** the type witness in place across that addition. The
enumeration test closes the route added later without thinking. And the response test closes the
one none of the others see: a route that calls `readEntry` in a **loop** defeats the type witness
entirely while importing nothing new.

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
`is-sent-once-per-local-date`, carrying a second `@attests`; §5.7 permits that because each claim
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

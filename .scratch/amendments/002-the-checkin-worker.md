# A002 — the check-in Worker

**Project**: `root` · **Package**: `apps/checkin` · **Status**: proposed · **Gated by**: A001,
F1

The cron trigger, the form, and the outbound mail. A thin shell over `core`: everything here
needs a Worker to judge, and nothing here should need more than that.

Blocked on **F1** — if `send_email` does not work inside a `scheduled` handler, the send moves
to a `fetch` route and `root/checkin/prompt/is-sent-once-per-local-date` becomes a claim about a
different handler.

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

## Add

### `root/checkin/form/get-does-not-write`

**Kind**: capability
**Claim**: A GET to a prompt link never writes. Only POST records measures.

**Witnesses** — three:

| Kind | Attests                                                               |
| ---- | --------------------------------------------------------------------- |
| type | the GET handler's requirement channel admits no operation that writes |
| test | GET the link, then assert no entry exists and `answered_at` is unset  |
| test | POST on the production path records the measures                      |

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
**Claim**: However many times the scheduled handler runs, at most one prompt is created and at
most one send occurs for a local date.

**Witnesses** — two:

| Kind | Attests                                                                                     |
| ---- | ------------------------------------------------------------------------------------------- |
| test | run the handler _n_ times **at the send hour** with an injected clock; one prompt, one send |
| test | run the handler at all 24 hours of a simulated local day; one prompt, one send              |

**Coverage.** The first holds the hour fixed, which is what isolates idempotency from the
schedule: a handler that sends once only because one hour matched cannot pass it. The second adds
the case where the duplicate arrives from a _different_ hour rather than from a retry. The first
is this claim's solo witness (§5.7); the second is shared with the claim below.

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
**Claim**: A prompt is sent when the local hour equals the configured send hour, and at no other
hour.

**Witnesses** — two:

| Kind | Attests                                                                                    |
| ---- | ------------------------------------------------------------------------------------------ |
| test | run the handler at all 24 hours of a simulated local day; one send, at the configured hour |
| test | change the configured send hour; the send follows it                                       |

**Coverage.** The full-day run covers _at no other hour_. The configuration test is this claim's
solo witness (§5.7), and it is also what keeps the claim about the **configured** hour rather
than about 21:00 — a handler with the fixture's hour hardcoded passes the full-day run and fails
this one.

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

**Witnesses** — two:

| Kind | Attests                                                                          |
| ---- | -------------------------------------------------------------------------------- |
| lint | an email-shaped string literal is denied under `apps/checkin/**`                 |
| test | change the configured mail domain; the address the Worker **sends from** follows |

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

Every test in this amendment runs under `wrangler dev` / miniflare with `--local`. Nothing here
talks to Cloudflare, which is what keeps these claims rederivable from a checkout.

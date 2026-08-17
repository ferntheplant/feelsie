# A002 — the check-in Worker

**Project**: `checkin` (`apps/checkin`) · **Status**: proposed · **Gated by**: A001, F1

The cron trigger, the form, and the outbound mail. A thin shell over `core`: everything here
needs a Worker to judge, and nothing here should need more than that.

Blocked on **F1** — if `send_email` does not work inside a `scheduled` handler, the send moves
to a `fetch` route and `checkin/prompt/one-per-local-date` becomes a claim about a different
handler.

## Add

### `checkin/form/get-does-not-write`

**Kind**: capability
**Claim**: A GET to a prompt link never writes. Only POST records measures.
**Witness**: test — GET the link, then assert no entry exists and `answered_at` is unset.

The highest-value test in the project, and the failure it prevents is not a security one. Mail
scanners and link-preview tools open the links in your inbox before you do. A GET that wrote
would mean some days were answered — with whatever the defaults are — before you ever touched
the email, and you would never see it happen.

### `checkin/prompt/one-per-local-date`

**Kind**: capability
**Claim**: The scheduled handler creates at most one prompt for a local date, however many times
it runs.
**Witness**: test — run the handler twenty-four times across one simulated local day with an
injected clock; exactly one prompt exists and exactly one send occurred.

The cron fires hourly by design, so this is not a defensive nicety — it is the property that
makes the schedule legal.

### `checkin/exposes-no-history`

**Kind**: capability
**Claim**: The check-in Worker serves no route that returns any entry other than the one the
presented token authorises.
**Witness**: test — enumerate the Worker's routes and assert the set is exactly the expected
one.

The check-in hostname is deliberately open ([`two-hostnames.md`](../../docs/rationale/two-hostnames.md)),
so this is the claim carrying the weight that the missing Access application would have carried.
A route added later without thinking is precisely how it gets violated, which is why the witness
enumerates rather than spot-checks.

### `checkin/email/addresses-are-never-literal`

**Kind**: capability
**Claim**: Every address the Worker sends from is constructed from the configured mail domain.
No email address appears as a literal anywhere in the Worker.
**Witness**: lint — a rule denying an email-shaped string literal under `apps/checkin/**` — plus
a test that changes the configured domain and asserts the sender address follows.

This claim has now been rewritten twice, and both rewrites were forced by rules rather than by
taste. It is worth keeping the trail, because the end state is much stronger than the start and
nobody chose it directly.

**Draft 1**: "the sending address is on the onboarded subdomain, and the recipient is a
**verified** destination address." Cut in half by the rule that a claim must be rederivable from
a checkout — whether Cloudflare verified a recipient happened in a dashboard. That half is now a
step in [the runbook](../../docs/runbooks/onboard-the-mail-subdomain.md).

**Draft 2**: "every address the Worker sends from is on the mail subdomain." Killed by this being
a public repository: the domain is a secret, so no checkout holds the value to compare against.

**What survived** is a claim about the mechanism instead of the value, and it catches the failure
that would actually occur — a hardcoded `checkin@mail.example.com` pasted in while debugging and
never removed. The two earlier drafts only ever checked one string. See
[C14](../CRUX-FEEDBACK.md).

The witness moved up a rung as a result: a lint rule denies at the moment the literal is written,
where a test could only sample the paths it walks.

### `checkin/prompt/is-sent-at-the-send-hour`

**Kind**: capability
**Claim**: A prompt is sent when the local hour equals the configured send hour, and at no other
hour.
**Witness**: test — run the handler at every hour of a simulated local day with an injected
clock, and assert exactly one send, at the configured hour.

F4 cleared, and cleared into a better claim than the one it was blocking. The draft was waiting
on a number — "the prompt is sent at 21:00" — and the answer was that 21:00 is a _default_, with
the hour and the zone both configurable. So the claim never mentions 21:00 at all.

That is the stronger form. A claim naming the literal hour would have to be reworded the first
time you moved it, and rewording a claim puts every witness attesting it back into the audit
scope. This one survives a configuration change, because the configuration is what it is about.

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

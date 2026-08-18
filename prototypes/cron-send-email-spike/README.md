# Does `send_email` work inside a `scheduled` handler?

[F1](../../.scratch/fog.md#f1), the fog item gating A002. The whole check-in Worker rests on one
Worker holding both a cron trigger and a send binding. F1 recorded the correction if it did not
work — _"the `scheduled` handler calls a `fetch` route on the same Worker and the send happens
there"_ — and noted that this changes what the send claim is a claim _about_.

## The answer

**Yes, and the shape does not change.** The interesting part is not that half.

Run it: `vp run --filter @feelsie/cron-send-email-spike spike`

## Three separable questions, and the third is the finding

### 1. Does the arrangement compile? · answered by `vp check`

A send is `Effect<EmailSendResult, SendEmailError, RuntimeContext>`. `Workers.cron` types its
handler as returning `Effect<void, unknown, Req>` and itself as requiring
`Exclude<Req, RuntimeContext>` — so the event source discharges the requirement, and a send
inside a scheduled handler is not merely permitted but _typed_. This is the cheapest half of the
answer and no run was needed for it.

**One real type error on the way, and it is worth keeping.** `HttpServerResponse.json` returns an
`Effect` where `.text` returns a response, because serialisation can fail. Returning it unyielded
type-checks as far as the handler and fails against `WorkerShape`, with the mismatch reported
against the whole 60-line `Effect.gen` rather than the line.

### 2. Does the send execute from a scheduled fire? · answered by a run

Fired through `/cdn-cgi/handler/scheduled?cron=<expr>&format=json` — the Miniflare-compatible
manual trigger route the local runtime exposes alongside the Node-side timer it starts per
expression. The handler writes an `attempted` row, sends, then writes a `sent` row, and a `fetch`
route reads the table back. Only the `sent` row distinguishes _the binding works here_ from _the
handler ran_.

It does, and the emulator says so twice over. The run logs the send, and the body lands on disk:

```
send_email binding called with MessageBuilder:
From: prompt@mail.spike.example
To: inbox@spike.example
Subject: spike
Text: .alchemy/local/email/text/2db9fd16-….txt
```

The address restrictions are enforced on that path too. The second schedule sends to an address
outside the binding's pinned `destinationAddress`, and it gets no `sent` row — the local simulator
validates sender and recipient allow-lists exactly as Miniflare does, on a scheduled fire as much
as on a request.

### 3. What happens when that send fails? · **nothing, and this is the finding**

The refused fire returns `{"outcome":"ok"}` with HTTP 200.

`CronEventSourceLive` wraps every handler in `Effect.catchCause(() => Effect.void)`. Alchemy
documents the consequence plainly — _"a failing handler won't crash the Worker … that also means
Cloudflare never observes a failed invocation, so its platform-level retry (and
`controller.noRetry()`) never comes into play here"_ — and it is much sharper for a daily email
than for the feed sync the docs illustrate it with:

> **The mail can stop going out and every signal the platform offers will read normal.** The
> invocation succeeded. The retry never engaged. The metric that would have moved is the one
> `docs/gotchas.md` already says not to trust.

**What this costs A002.** A witness that observes the _invocation_ attests nothing about the send.
The claim needs a witness that observes the send itself — the `sent` row in this spike is the
cheap version of it — and the handler needs to make its own failure visible, because the event
source will not. `Effect.retry` is the primary retry control here, not the platform's.

This is the third of the three questions and the only one whose answer changes what gets built.

## What this spike does **not** settle

**That Cloudflare's production Email service accepts a send from a scheduled invocation.** The
local simulator is Miniflare-equivalent validation, not the real service. Nothing suggests a
restriction — the binding hangs off `env`, which every handler receives, and Cloudflare's own API
reference documents `env.EMAIL.send()` with no handler constraint and error codes that are all
about the message rather than about the caller — but "nothing suggests it" is a reading, and F1
asked for evidence.

That residual is a **deployment verification**, not a design question. It belongs with O3 in
[`ALCHEMY-MIGRATION.md`](../../.scratch/ALCHEMY-MIGRATION.md) §4a and can be checked in one
minute the first time the real Worker is deployed. It cannot block A002's shape, because there is
no longer a reading of the evidence under which the shape changes.

**That the cron timer fires.** The two expressions here are `0 3 * * *` and `0 4 * * *`, chosen so
they will not come round during a test run and race the manual trigger. Whether Cloudflare fires a
schedule on time is a promise about someone else's product; `docs/rationale/the-cron-runs-every-hour.md`
is already written on the assumption that it does, and no witness here changes that.

> @grounds root/checkin/prompt/reuses-one-prompt-until-success
> @grounds root/checkin/prompt/records-a-failed-send
> @grounds root/prompt/expires-after-seven-days

# A prompt is created before it is sent, and marked sent afterwards

The scheduled handler writes the prompt row, sends, and then writes the send time. Three
statements where one would do, and `0002_prompt_send_lifecycle.sql` rebuilt a table to allow it.

The rejected option is **send first, write the row after**, which is what `0001_core.sql`'s
`sent_at INTEGER NOT NULL` forced. It is simpler, it needs no nullable column, and it makes every
row that exists a row that was really sent.

It was rejected on the shape of its failure. The two orderings cannot make a D1 write and an
email send atomic, but they leave different states when either half fails:

- **Write-then-send**, the chosen order. A failure before the send returns leaves one unsent
  prompt, so the next fire retries the same token. A failure after the send returns but before
  `sent_at` lands leaves an ambiguous prompt: the next fire retries and can send the same email
  twice.
- **Send-then-write**, the rejected order. The window's failure is an email in your inbox whose
  token is in no table. The next fire finds no prompt, creates one, and sends a **second** email
  for the same local date with a different token. The first link can never work.

The chosen order cannot guarantee exactly-once delivery. The email binding has no idempotency key,
and it cannot share a transaction with D1. What this order guarantees is narrower and useful:
every retry uses one valid prompt, and later fires stop after a returned send is recorded.

## What it costs

**`sent_at` is nullable, so "does this prompt authorise anything" is a question with three
answers rather than two.** `answerPrompt` has to refuse an unsent prompt explicitly, and it
refuses it as `PromptNotFoundError` — a token that was never delivered and a token that never
existed are the same thing from outside, and the check-in hostname is open to the internet
([`two-hostnames.md`](./two-hostnames.md)), so they had better stay the same thing.

**`expires_at` went away**, and that is a consequence rather than a separate decision. It was
always `sent_at + seven days`; once `sent_at` could be absent, a stored copy would have had to be
absent too, and a nullable column holding a value derivable from another nullable column is two
things to keep true where there is one fact. `root/prompt/expires-after-seven-days` reads better
against the derived value: the claim says "seven days after its **send** time", and under
`0001_core.sql` the send time was really the creation time and nobody could tell.

## What it does not buy

**It does not buy exactly-once delivery.** A lease can prevent overlapping attempts, but it cannot
distinguish a crash before email acceptance from one after acceptance. Only a provider idempotency
key or transactional delivery can close that window.

**It does not make a failed send visible.** That is
`root/checkin/prompt/records-a-failed-send`, and it needs the `send_failures` row, because
Alchemy's cron event source discards the handler's failure and reports the invocation as a
success. This document is about ordering; that claim is about the fact that nothing outside the
handler is watching.

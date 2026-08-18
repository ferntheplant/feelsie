> @grounds root/checkin/prompt/is-sent-once-per-local-date
> @grounds root/checkin/prompt/records-a-failed-send
> @grounds root/prompt/expires-after-seven-days

# A prompt is created before it is sent, and marked sent afterwards

The scheduled handler writes the prompt row, sends, and then writes the send time. Three
statements where one would do, and `0002_prompt_send_lifecycle.sql` rebuilt a table to allow it.

The rejected option is **send first, write the row after**, which is what `0001_core.sql`'s
`sent_at INTEGER NOT NULL` forced. It is simpler, it needs no nullable column, and it makes every
row that exists a row that was really sent.

It was rejected on the shape of its failure. Between the send returning and the insert landing
there is a window, and the two things that can happen in it are not symmetrical:

- **Write-then-send**, the chosen order. The window's failure is a prompt that exists and was
  never sent. The next fire of the same local date finds it unsent and sends it — the recovery is
  the ordinary path, and it costs nothing.
- **Send-then-write**, the rejected order. The window's failure is an email in your inbox whose
  token is in no table. The next fire finds no prompt, creates one, and sends a **second** email
  for the same day. `root/checkin/prompt/is-sent-once-per-local-date` is not merely unwitnessed
  by that order; it is false under it.

The asymmetry is the whole argument. One order fails towards a retry and the other fails towards
a duplicate, and the state that makes the retry possible — a prompt that exists and is not sent —
is exactly the state the simpler schema could not represent.

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

**It does not make a failed send visible.** That is
`root/checkin/prompt/records-a-failed-send`, and it needs the `send_failures` row, because
Alchemy's cron event source discards the handler's failure and reports the invocation as a
success. This document is about ordering; that claim is about the fact that nothing outside the
handler is watching.

# A004 — the backup

**Project**: `root` · **Package**: `apps/checkin` · **Status**: proposed · **Gated by**: A002

A second cron trigger on the check-in Worker exports the entries and writes the file to R2.

## Rewritten after A005, and again after F1

This is the last amendment written under the rule A005 retracted — **every add names exactly one
witness** — and it carried the fingerprint in the worst place. Its claim led with the R2 write
while its own prose said _"the restore leg is the claim"_, so the claim and the paragraph under it
disagreed about what was being promised, and the witness followed the claim rather than the prose.

Three things changed here and none of them is cosmetic:

- **The claim leads with the restore**, and says _exactly_ rather than _containing_ — see the
  first add. A restore that appends to a non-empty database satisfies "contains every entry" and
  hands you a database that looks fine and is wrong.
- **The witness set uses R2's least-privilege split**, which D1 does not have and R2 does. This is
  the amendment [`ALCHEMY-MIGRATION.md`](../ALCHEMY-MIGRATION.md) §5 predicted would improve.
- **A second claim arrives from F1.** The backup handler is a scheduled handler on the same
  Worker, so it inherits the silence the F1 spike found, and for a backup the consequence is worse
  than for the mail.

**`wrangler dev --local` is gone from the witnesses.** The old draft named it; this repository has
no wrangler. The replacement is `Test.make({ dev: true })`, which runs the Worker in workerd inside
the test process with R2 and D1 emulated — confirmed end to end by
[`prototypes/alchemy-credentials-spike/`](../../prototypes/alchemy-credentials-spike/) and used
again by [`prototypes/cron-send-email-spike/`](../../prototypes/cron-send-email-spike/).

## One mechanical fact that shapes both claims

**A Worker cannot use D1's export endpoint.** `Cloudflare.D1.ExportDatabase` is an account-API
operation — it takes an `accountId` and `Credentials` and returns a signed URL, which is an
`Action` at deploy time, not something a runtime handler can reach. So the backup handler reads
rows through the `QueryDatabase` binding and serialises them itself.

That is more code and a better claim. The export format is repository code rather than a vendor
endpoint, which means the round trip below is judgeable from a checkout instead of being a promise
about Cloudflare's dump.

## Add

### `root/checkin/backup/restores-every-entry`

**Kind**: capability
**Claim**: The object the backup handler writes restores to a database whose entries are exactly
the entries that existed when it was written.

**Witnesses** — three:

| Kind | Attests                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| test | seed entries, run the handler, restore the written object into an empty database, compare the full entry set both ways            |
| test | restore into a database that already holds **different** entries; the result is the exported set, not the union                   |
| type | the restore leg holds a `Cloudflare.R2.ReadBucket` handle and the handler a `WriteBucket`, so neither can perform the other's job |

**Coverage.** The failure a reader sees is one thing — _the day I needed it, my data was gone or
wrong_ — so this is one claim, and the three witnesses close three ways into it.

The first is the round trip, and it carries most of the claim. It must seed the awkward values
rather than three tidy rows: an entry with a note and one without (`root/entry/note-round-trips`),
measures at both 1 and 10 (`root/entry/measures-are-one-to-ten`), and a date either side of a
daylight-saving boundary (`root/local-date/is-zoned`). An export that drops nulls or reformats a
date passes a tidy fixture and loses real data.

The second is the word _exactly_. A restore that inserts without clearing leaves a database that
is a superset of the backup, which is the failure mode nobody tests for because the restore
"worked" — and it is the likely one, since the natural implementation is a loop of inserts.

The third is what stops the first from cheating. A round trip that seeds and reads through one
handle can pass while the object in the bucket is empty or unparseable. Splitting the capability
makes the restore path unable to write what it is about to assert on — a violation is
unrepresentable rather than caught, which is why it is kind 1 and not a fourth test.

**§5.8's opposite-polarity check.** Every witness above watches the round trip succeed; none is a
prohibition, so the pair the rule asks for is not needed here. The prohibition-shaped risk — the
handler writing nothing at all — is the second claim's, not this one's.

### `root/checkin/backup/records-a-failed-export`

**Kind**: capability
**Claim**: When the export or the write fails, the handler records the failure. A backup the
handler reports as written is one whose object was written.

**Witnesses** — two:

| Kind | Attests                                                                 |
| ---- | ----------------------------------------------------------------------- |
| test | force the bucket write to fail; the failure is recorded with its reason |
| test | a write that returns records no failure                                 |

**Coverage.** The §5.8 pair. The first closes the silence; the second closes a handler that
reports failure unconditionally, which satisfies the first and is useless.

**This is F1's finding applied a second time, and it lands harder here.**
`CronEventSourceLive` wraps every scheduled handler in `Effect.catchCause(() => Effect.void)`, so a
throwing handler reports a successful invocation — watched directly in
[`prototypes/cron-send-email-spike/`](../../prototypes/cron-send-email-spike/). For the daily mail
that costs you an email. For the backup it costs you the thing you were keeping _for_ the day
something went wrong, and you find out on that day.

**It is the same shape as `root/checkin/prompt/records-a-failed-send` in A002, deliberately kept
apart.** The two fail separately and a reader sees different things — mail that stopped, versus a
bucket that has been empty for a month. If a third scheduled handler ever arrives, the three should
collapse into one claim about the Worker's scheduled surface; two is not yet enough to say the
grouping is wrong, and splitting them now costs nothing but a slug.

## What is deliberately not claimed

**That a backup has actually happened recently.** The first draft had a witness for it — list the
bucket, read the newest object's timestamp, assert it is under 48 hours old — and it is gone under
the rule that a claim's state must be rederivable from the repository. An empty bucket in
production is invisible to every checkout.

This is the sharpest instance of what that rule costs, and it should be recorded as such rather
than smoothed over: **a green catalog and an empty bucket are compatible states.** A backup is
exactly the thing nobody checks by hand, so "does the code back up correctly" and "is there a
backup" are not close to the same question, and crux can only answer the first.

The second is monitoring. It belongs to whatever watches the R2 bucket, and nothing in this
repository will tell you it is missing.

**The second claim narrows that gap and does not close it.** Recording a failed export means the
information exists inside the Worker; it does not mean anybody reads it. That is the same line
`root/dns/apex-mail-is-declared` draws in A006 — the declaration is claimable, the drift is not.

- **D1 time travel covers 30 days.** A property of Cloudflare's product, and nothing here could
  break it. Not a claim, and it is the reason the gap above is survivable rather than fatal.

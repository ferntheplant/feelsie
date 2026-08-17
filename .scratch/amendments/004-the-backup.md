# A004 — the backup

**Project**: `checkin` (`apps/checkin`) · **Status**: proposed · **Gated by**: A002

A second cron trigger on the check-in Worker exports D1 and writes the file to R2.

## Add

### `checkin/backup/writes-a-restorable-export`

**Kind**: capability
**Claim**: The backup handler writes an object to the configured R2 bucket, and the object it
writes restores to a database containing every entry.
**Witness**: test — run the handler against a local R2 binding under `wrangler dev --local`,
seed entries first, then restore the written object and compare.

The restore leg is the claim. A backup that writes a file is not a backup; a backup that
restores is. Testing the write alone would attest something narrower than the claim says, which
is precisely the mismatch an audit is meant to catch, and it is the mismatch that shows up on
the day you need the file.

## What is deliberately not claimed

**That a backup has actually happened recently.** The draft of this amendment had a second
witness — list the bucket, read the newest object's timestamp, assert it is less than 48 hours
old — and it is gone under the rule that a claim's state must be rederivable from the
repository. An empty bucket in production is invisible to every checkout.

This is the sharpest instance of what that rule costs, and it should be recorded as such rather
than smoothed over: **a green catalog and an empty bucket are compatible states.** A backup is
exactly the thing nobody checks by hand, so "does the code back up correctly" and "is there a
backup" are not close to the same question, and crux can only answer the first.

The second is monitoring. It belongs to whatever watches the R2 bucket, and nothing in this
repository will tell you it is missing. D1's 30-day time travel is the reason that is survivable
rather than fatal.

- **D1 time travel covers 30 days.** A property of Cloudflare's product, and nothing here could
  break it. Not a claim.

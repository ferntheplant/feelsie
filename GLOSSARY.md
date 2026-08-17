# Feelsie

Records how you feel each day, and shows the history back to you.

This project uses the crux vocabulary — claim, catalog, witness, marker, standing, verdict,
fog, amendment, rationale, ruling. The words below are feelsie's own.

## Language

**Measure**:
One of the three quantities feelsie tracks: mood, energy, and sleep. A measure is an integer
from 1 to 10.
_Avoid_: metric, score, value, field, dimension

**Entry**:
The three measures recorded for one local date. At most one entry exists for a local date.
_Avoid_: record, log, submission, response, datapoint

**Check-in**:
The act of recording an entry.
_Avoid_: log, submit, report, fill in

**Prompt**:
A dated invitation to check in. A prompt holds a token, a send time, and an expiry. One prompt
exists for each local date.
_Avoid_: reminder, nudge, ping, notification, invite

**Token**:
The random secret that authorises writing one entry. It travels in the prompt's link, and it
is the only protection on the check-in form.

**Local date**:
The calendar date in the configured time zone, written `YYYY-MM-DD`. Never the UTC date. A
prompt and an entry are both keyed by local date.
_Avoid_: date, day, calendar day

**Send hour**:
The hour, in the configured time zone, at which a prompt is sent.

**Dashboard**:
The private view of the history and the summary statistics. It reads and never writes.

**Streak**:
The number of consecutive local dates whose prompt was answered.

## Cloudflare terms

Cloudflare's words, not feelsie's. They are here because a claim uses them, and a reader must
not have to guess which sense is meant.

**Destination address**:
An email address that Cloudflare has verified as a recipient. The `send_email` binding refuses
any other recipient.

**Onboarded subdomain**:
The subdomain registered with Cloudflare Email Service for sending. It is never the apex
domain.

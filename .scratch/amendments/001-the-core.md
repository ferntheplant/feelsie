# A001 — the core

**Project**: `core` (`packages/core`) · **Status**: proposed · **Gated by**: nothing

Tokens, local dates, and the entry table. No Cloudflare imports, no network, no emulator. Every
witness below runs under `vp test`.

F5, F8, and F11 are all cleared, so nothing blocks this. **It is the next unit of work.**

The note is a day-one field, not a maybe: the first migration carries a nullable `note` column
and `core/entry/note-round-trips` claims what happens to what you type into it.

**This is written in Effect v4** ([rationale](../../docs/rationale/core-is-written-in-effect.md)),
which was decided before the amendment rather than after, because it changes the witness kinds
below rather than annotating them. One claim moved from kind 2 to kind 1 as a direct result.

## Add

### `core/token/is-random`

**Kind**: capability
**Claim**: A token is 32 bytes from a cryptographic random source, encoded as base64url.
**Witness**: two, and it needs both.

- test — length, alphabet, and that a thousand tokens are a thousand distinct values.
- lint — `Math.random` is not callable inside `packages/core`.

The test cannot tell a CSPRNG from a good PRNG, so on its own it would affirm a token generated
by `Math.random`. The lint rule is what closes that, and it is the higher rung of the ladder: it
denies at the moment the wrong call is written rather than sampling the output afterwards.

### `core/token/authorises-one-date`

**Kind**: capability
**Claim**: A token authorises writing the entry for its own local date, and no other date.
**Witness**: test — present a token for Tuesday and ask to write Wednesday; the write is
refused.

### `core/token/survives-answering`

**Kind**: capability
**Claim**: Answering a prompt does not consume its token. The same token writes the same date
again until the prompt expires.
**Witness**: test — answer twice with different measures; the second write succeeds.

### `core/prompt/expires-after-seven-days`

**Kind**: capability
**Claim**: A prompt's expiry is seven days after its send time, and a token is refused after it.
**Witness**: test — with an injected clock, at six days and at eight.

### `core/local-date/is-zoned`

**Kind**: capability
**Claim**: The local date and the local hour are computed in the configured time zone, never in
UTC and never from the host's zone.
**Witness**: test — instants either side of a daylight-saving transition, and an instant where
the UTC date and the local date differ.

This is the claim that pays for the hourly cron. If it is wrong, every other date-keyed
guarantee is wrong underneath it, silently.

### `core/entry/one-per-local-date`

**Kind**: capability
**Claim**: At most one entry exists for a local date.
**Witness**: schema — `entries.date` is the primary key. Attested by the marker on the
migration, plus a test that writes twice and counts rows.

Kind 1. A duplicate is unrepresentable rather than merely prevented, so no future handler can
get it wrong.

### `core/entry/measures-are-one-to-ten`

**Kind**: capability
**Claim**: Each measure is an integer from 1 to 10 inclusive.
**Witness**: schema — the `CHECK` constraints, plus a test that asserts 0 and 11 are rejected.

### `core/entry/last-write-wins`

**Kind**: capability
**Claim**: A second answer for a local date replaces the measures of the first.
**Witness**: test — the upsert, read back.

### `core/config/is-required-not-defaulted`

**Kind**: capability
**Claim**: The time zone, the send hour, and the mail domain are required configuration. Code
that computes a local date, schedules a prompt, or builds a sender address cannot run without
them, and no value among the three has a fallback.
**Witness**: two, at two rungs.

- **type** — the three are a service in the Effect context. A function that reads a local date
  without being given a time zone does not compile.
- **test** — decode the configuration with each of the three absent in turn, with a send hour of
  `"25"` and a time zone of `"Mars/Olympus"`; every case fails.

The type witness carries the important half and it is why this claim is worth its cost. The
dangerous line is `env.TZ ?? "UTC"` — it is what a reasonable person writes, it type-checks, it
never throws, and it silently moves every local date in the system, so
`core/local-date/is-zoned` keeps passing while the running system files entries under the wrong
day. Under a context service there is no place to put that `??`: the value is either provided or
the program does not compile.

The test covers what the type cannot, which is a value that is present and wrong. Both are
needed and neither is sufficient — see [C10](../CRUX-FEEDBACK.md).

The three sit in one claim because they arrive by the same mechanism and would be given a
fallback by the same careless line.

### `core/entry/note-round-trips`

**Kind**: capability
**Claim**: An entry's note is stored and returned exactly as written, and an entry with no note
is valid.
**Witness**: test — write and read back a note containing newlines, quotes, an apostrophe, and
an emoji; separately, write an entry with no note at all.

The note is the one free-text field in the system, and free text is where a storage layer
quietly helpfully mangles things. Escaping belongs at the point of rendering, not at the point
of writing; a note that comes back as `it&#39;s fine` was damaged on the way in, and no later
change recovers the original.

Both halves are claimed together because they fail together: the column is nullable, and a
`NOT NULL` slipped in later would break the second half while the first still passes.

## Not claimed

- **The database is D1.** Nothing can violate it; there is no second database to drift onto.
  Rationale only, if anyone ever asks.
- **The measures are mood, energy, and sleep.** This is what the project _is_, not something the
  codebase could fail at. Naming it in the glossary is the whole of the work.

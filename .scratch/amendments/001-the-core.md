# A001 — the core

**Project**: `core` (`packages/core`) · **Status**: proposed · **Gated by**: nothing

Tokens, local dates, and the entry table. No Cloudflare imports, no network, no emulator. The
computational witnesses run under `vp check` or `vp test`.

F5, F8, and F11 are all cleared, so nothing blocks this. **It is the next unit of work.**

The note is a day-one field, not a maybe: the first migration carries a nullable `note` column
and `core/entry/note-round-trips` claims what happens to what you type into it.

**This is written in Effect v4** ([rationale](../../docs/rationale/core-is-written-in-effect.md)),
which was decided before the amendment rather than after, because it changes the witness kinds
below rather than annotating them. One claim moved from kind 2 to kind 1 as a direct result.

## Add

### `core/token/uses-web-crypto`

**Kind**: capability
**Claim**: Token bytes come from the Web Crypto API.
**Witness**: test — make `crypto.getRandomValues` write known bytes into the production generator
and assert that the token encodes those bytes.

### `core/token/never-uses-math-random`

**Kind**: development
**Claim**: No code in `packages/core` calls `Math.random`.
**Witness**: lint — `Math.random` is not callable inside `packages/core`.

### `core/token/is-32-bytes-base64url`

**Kind**: capability
**Claim**: A token is 32 bytes encoded as base64url.
**Witness**: test — length, alphabet, and that a thousand tokens are a thousand distinct values.

**These were one claim, `core/token/is-random`, and splitting them is
[C10](../CRUX-FEEDBACK.md) applied twice to its own example.** A Web Crypto test, a lint rule, and
an output-shape test answer three different questions.

Split, each has one honest witness. The lint rule denies `Math.random` when the wrong call is
written, while the Web Crypto test observes the approved production path.

### `core/token/authorises-one-date`

**Kind**: capability
**Claim**: A token authorises writing the entry for its own local date, and no other date.
**Witness**: test — present a token for Tuesday and ask to write Wednesday; the write is refused
without a database change. The same token then writes Tuesday.

### `core/token/survives-answering`

**Kind**: capability
**Claim**: Answering a prompt does not consume its token. The same token writes the same date
again until the prompt expires.
**Witness**: test — answer twice with different measures; the second write succeeds.

### `core/prompt/expires-after-seven-days`

**Kind**: capability
**Claim**: A prompt's expiry is seven days after its send time, and a token is refused after it.
**Witness**: test — with an injected clock, one millisecond before seven days, exactly at seven
days, and after seven days. The exact boundary is refused without a database change.

### `core/local-date/is-zoned`

**Kind**: capability
**Claim**: The local date and the local hour are computed in the configured time zone, never in
UTC and never from the host's zone.
**Witness**: test — two configured zones, instants either side of a daylight-saving transition,
and an instant where the UTC date and the local date differ.

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
**Witness**: schema — the `CHECK` constraints, plus a test that asserts every measure rejects 0,
11, and a non-integer.

### `core/entry/last-write-wins`

**Kind**: capability
**Claim**: A second answer for a local date replaces the measures of the first.
**Witness**: test — the upsert, read back.

### `core/config/is-context-service`

**Kind**: capability
**Claim**: The time zone, send hour, and mail domain form a service in the Effect context. Code
that computes a local date, schedules a prompt, or builds a sender address requires that service.
**Witness**: type — the public package interface exposes the configured operations and their
only configuration layer. A configured operation cannot run without that layer.

The type witness keeps the configuration requirement visible in every configured operation. It
does not prove that the configuration layer has no fallback. The next claim carries that part.

### `core/config/is-required`

**Kind**: capability
**Claim**: The time zone, send hour, and mail domain are required runtime configuration. None has
a fallback.
**Witness**: test — run the local-date, schedule, and sender operations with each value absent in
turn; every operation fails in every case.

The dangerous line is `env.TZ ?? "UTC"`. It type-checks, never throws, and silently moves every
local date. The runtime witness catches that line.

### `core/config/is-validated`

**Kind**: capability
**Claim**: The time zone and send hour are validated before use. An unknown time zone or a send
hour outside 0 through 23 is refused.
**Witness**: test — run a configured operation with send hours of `"-1"` and `"25"`, then with a
time zone of `"Mars/Olympus"`; every case fails before use.

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

Both halves share one storage boundary and one test witness. A `NOT NULL` change breaks the
no-note case, while storage encoding can break the exact round trip.

## Not claimed

- **The database is D1.** Nothing can violate it; there is no second database to drift onto.
  Rationale only, if anyone ever asks.
- **The measures are mood, energy, and sleep.** This is what the project _is_, not something the
  codebase could fail at. Naming it in the glossary is the whole of the work.

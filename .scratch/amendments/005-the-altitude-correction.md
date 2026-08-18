# A005 — the altitude correction

**Project**: `core` (`packages/core`) · **Status**: proposed · **Gated by**: nothing

A001 shipped fourteen claims. Six of them describe checks rather than promises. This replaces
those six with two, and **changes no test, no production code, and no migration.**

Six markers keep their bodies and their positions. Only the slug in their `@attests` changes. That
is the whole shape of the finding: **the altitude was wrong and the witnesses were right.**

## Why

A001 was built under a rule crux has since retracted — that each marker must attest its full
claim, so a claim no single marker could reach had to be split until one could. Applied twice, it
produced a catalog nobody promises. Crux now says the opposite:

> **Group claims by the failure a reader can see. Do not group them by the check that finds it.**

Crux §5.9 records the retraction and cites this package as the evidence for it. Crux §5.8 adds
**coverage**, which is what makes one claim with three witnesses legal: a witness may support part
of a claim and be sound, and the auditor asks separately whether the set reaches the whole claim.
Both are summarised in [`CRUX.md`](../../CRUX.md).

This amendment is the repair in the repository that produced the finding.

## Run this before A002

Nothing gates it, and it gates nothing. Take it early anyway. `checkin` and `dashboard` will be
written by reading `core`'s catalog, and a catalog at the wrong altitude teaches the wrong
altitude to everything built next.

## Delete

### `core/token/uses-web-crypto`

### `core/token/is-32-bytes-base64url`

### `core/token/never-uses-math-random`

Three claims for one promise. A reader is not promised a byte source, a forbidden call, or an
output shape. A reader is promised a token nobody can guess, and each of these is one of the ways
that promise breaks.

`never-uses-math-random` is the clearest case. `@kind development` was doing real work — it was a
statement about the source code — but the property a reader cares about is unchanged by which
function produced the weak bytes.

### `core/config/is-context-service`

### `core/config/is-required`

### `core/config/is-validated`

`is-context-service` is a witness with a claim's name. _The configuration is a service in the
Effect context_ describes an instrument, not a subject. It exists because nothing else could hold
the type-level half of the configuration promise.

`is-required` and `is-validated` are one promise split by cause. An absent time zone and
`"Mars/Olympus"` produce the same visible failure: the system records the wrong local date, or it
does not start.

## Add

### `core/token/cannot-be-guessed`

**Kind**: capability
**Claim**: Nobody can guess a token. Token bytes come from the Web Crypto API, a token is 32 bytes
encoded as base64url, and no code in `packages/core` calls `Math.random`.

**Witnesses** — three, all already written:

| Marker              | Attests                                                       | Kind |
| ------------------- | ------------------------------------------------------------- | ---- |
| `token.test.ts:8`   | the production path calls `getRandomValues`, with known bytes | test |
| `token.test.ts:29`  | length, alphabet, and a thousand distinct values              | test |
| `vite.config.ts:83` | `Math.random` is not callable in `packages/core`              | lint |

**Coverage.** The lint rule closes one way to fail and affirms nothing on its own — a hand-written
weak generator passes it. The Web Crypto test supplies the positive observation, and the shape
test covers the case where a correct source is truncated or re-encoded. Together they reach the
claim.

The lint rule's scope is all of `packages/core` and the claim is about tokens. That is
over-attribution, which crux permits and under-attribution is what it forbids.

### `core/config/is-required-and-valid`

**Kind**: capability
**Claim**: The time zone, send hour, and mail domain are required and validated before use. No
value has a fallback, an unknown time zone is refused, a send hour outside 0 through 23 is
refused, and a configured operation cannot run without the configuration.

**Witnesses** — three, all already written:

| Marker              | Attests                                                      | Kind              |
| ------------------- | ------------------------------------------------------------ | ----------------- |
| `config.test.ts:17` | every configured operation requires `CoreConfig` in its type | test (type-level) |
| `config.test.ts:26` | each value absent in turn; every operation fails             | test              |
| `config.test.ts:42` | `-1`, `25`, `1.5`, `noon`, `""`, `Mars/Olympus`              | test              |

**Coverage.** The type-level test closes the way to fail where an operation reads configuration
from module scope and bypasses the layer. The absence test closes `env.TZ ?? "UTC"`, which type
checks, never throws, and silently moves every local date. The validation test closes a value that
is present and wrong. No two of the three reach the claim without the third.

## What stays, and why

§5.9 was applied to all fourteen. The other eight each name a failure a reader sees, and each
fails independently of every other.

| Claim                                  | The failure a reader sees          |
| -------------------------------------- | ---------------------------------- |
| `core/token/authorises-one-date`       | a token writes somebody else's day |
| `core/token/survives-answering`        | you answer, and cannot correct it  |
| `core/prompt/expires-after-seven-days` | a stale link still works           |
| `core/local-date/is-zoned`             | the wrong day is recorded          |
| `core/entry/one-per-local-date`        | two rows for one day               |
| `core/entry/measures-are-one-to-ten`   | an out-of-range measure is stored  |
| `core/entry/last-write-wins`           | a correction does not stick        |
| `core/entry/note-round-trips`          | your note comes back mangled       |

`one-per-local-date` and `last-write-wins` are the pair worth checking, because both concern
writing twice. They stay apart: duplicated rows and a lost correction are different things to see.

## The work

1. Rewrite the six markers' `@attests` slugs. Six single-line edits.
2. Replace six catalog entries in `docs/catalog/core.md` with two.
3. Re-point five `@grounds` lines across two rationales:
   - `the-token-is-random.md` grounds all three deleted token slugs. Three lines become one.
   - `core-is-written-in-effect.md` grounds `is-context-service` and `is-required`. Two lines
     become one.

   Both documents are still about the claims that replace them, so this is a rewrite and not a
   deletion. Leaving them would produce backward dangles — reported and not errors, which is
   exactly why nothing would stop you.

4. Run `vp run ready`.
5. Audit claim by claim, and set coverage for the two new claims.

The catalog goes from fourteen claims to ten — which is the number the tracker carried before the
build, reached from the other direction. Read no significance into the coincidence beyond the
obvious one: fourteen was never a count of promises.

**Nothing under `packages/core/src` changes except the six comment lines.** If this amendment
grows a test edit, the diagnosis was wrong.

## Not claimed

- **That the six markers are the right witnesses.** They were audited under A001 and each was
  repaired until it attested its claim. This amendment moves the claims, not the instruments, so
  their standings carry — but the **coverage** of the two new claims is a new question, and no
  earlier audit answers it.

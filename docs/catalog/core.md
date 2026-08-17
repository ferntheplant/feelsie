# Core Catalog

> @claim core/token/uses-web-crypto
> @kind capability

Token generation gets its bytes from the Web Crypto API.

> @claim core/token/never-uses-math-random
> @kind development

No code in `packages/core` calls `Math.random`.

> @claim core/token/is-32-bytes-base64url
> @kind capability

A token is 32 bytes encoded as base64url.

> @claim core/token/authorises-one-date
> @kind capability

A token authorises writing the entry for its own local date, and no other local date.

> @claim core/token/survives-answering
> @kind capability

Answering a prompt does not consume its token. The same token writes the same local date again
until the prompt expires.

> @claim core/prompt/expires-after-seven-days
> @kind capability

A prompt expires at the instant seven days after its send time. Its token is accepted before
that instant and refused at or after it.

> @claim core/local-date/is-zoned
> @kind capability

The local date and local hour are computed in the configured time zone, never in UTC or the host
time zone.

> @claim core/entry/one-per-local-date
> @kind capability

At most one entry exists for a local date.

> @claim core/entry/measures-are-one-to-ten
> @kind capability

Each measure is an integer from 1 to 10 inclusive.

> @claim core/entry/last-write-wins
> @kind capability

A second answer for a local date replaces the measures of the first.

> @claim core/config/is-context-service
> @kind capability

The time zone, send hour, and mail domain form a service in the Effect context. Code that computes
a local date, schedules a prompt, or builds a sender address requires that service.

> @claim core/config/is-required
> @kind capability

The time zone, send hour, and mail domain are required runtime configuration. None has a fallback.

> @claim core/config/is-validated
> @kind capability

The time zone and send hour are validated before use. An unknown time zone or a send hour outside
0 through 23 is refused.

> @claim core/entry/note-round-trips
> @kind capability

An entry's note is stored and returned exactly as written, and an entry with no note is valid.

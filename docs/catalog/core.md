# Core Catalog

> @claim root/token/cannot-be-guessed
> @kind capability

Nobody can guess a token.

> @claim root/token/authorises-one-date
> @kind capability

A token authorises writing the entry for its own local date, and no other local date.

> @claim root/token/survives-answering
> @kind capability

Answering a prompt does not consume its token. The same token writes the same local date again
until the prompt expires.

> @claim root/prompt/expires-after-seven-days
> @kind capability

A prompt expires at the instant seven days after its send time. Its token is accepted before
that instant and refused at or after it.

> @claim root/local-date/is-zoned
> @kind capability

The local date and local hour are computed in the configured time zone, never in UTC or the host
time zone.

> @claim root/entry/one-per-local-date
> @kind capability

At most one entry exists for a local date.

> @claim root/entry/measures-are-one-to-ten
> @kind capability

Each measure is an integer from 1 to 10 inclusive.

> @claim root/entry/last-write-wins
> @kind capability

A second answer for a local date replaces the measures of the first.

> @claim root/config/is-required-and-valid
> @kind capability

Missing or invalid configuration is refused before use. The time zone, send hour, and mail domain
are required with no fallback. The time zone must be known, the send hour must be an integer from
0 through 23, and the mail domain must be non-empty.

> @claim root/entry/note-round-trips
> @kind capability

An entry's note is stored and returned exactly as written, and an entry with no note is valid.

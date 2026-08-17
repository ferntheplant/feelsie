<!-- @grounds core/entry/one-per-local-date -->
<!-- @grounds core/entry/last-write-wins -->

# An entry is keyed by local date, and a second answer replaces the first

`entries.date` is the primary key. A second answer for a date is an upsert, and it overwrites
the three measures.

The rejected option was an append-only table of answers, with the current entry derived as the
latest row per date. It keeps the revision history, and revision history is the sort of thing
that feels free to keep and expensive to have thrown away.

It was rejected because nothing in the system wants it. The dashboard shows the history of your
days, not the history of your edits, and no statistic in the design reads a superseded value. An
append-only table would have bought a `GROUP BY` on every read and a second-guessing question on
every write, in exchange for data that nothing displays.

Keying by date also does more work than it looks like. It makes a duplicate entry
**unrepresentable** rather than merely unlikely, so the guarantee moves out of the Worker and
into the schema, where no future handler can get it wrong.

## Consequences

A correction is destructive. If you re-answer Tuesday with the wrong numbers, Tuesday's original
numbers are gone. This is accepted: the data is self-reported to a precision of one integer, and
the recovery path for a bad correction is another correction.

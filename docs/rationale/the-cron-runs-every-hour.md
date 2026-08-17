> @grounds core/local-date/is-zoned

# The cron runs every hour and the handler decides whether to send

The trigger is `0 * * * *`. On each firing the handler reads the local hour, stops unless it is
the send hour, stops again if a prompt already exists for the local date, and otherwise sends.

Cron triggers are UTC. The send hour is local, and the offset between them moves twice a year.
Two options were rejected:

- **A fixed UTC hour.** The email arrives an hour early or an hour late for half the year. For a
  daily habit that is attached to a time of day, that is not cosmetic.
- **Two cron entries and a seasonal switch.** It works and it is a standing invitation to be
  wrong in March, in a way that only shows up once and is never noticed.

Running hourly and deciding in code moves the daylight-saving question to
`Intl.DateTimeFormat`, which already knows the answer and is updated by somebody else.

The cost is twenty-three wasted invocations a day. They are free, and each one returns almost
immediately.

## Consequences

The handler runs many times for each email it sends, so it must be safe to run repeatedly. The
existence check on the local date is what provides that, and it is the reason a prompt is keyed
by local date rather than being appended.

It also means every question about "which day is it" is a question about the configured time
zone, never about UTC and never about the Worker's own clock. That is one function, and it is
worth testing at a daylight-saving boundary specifically.

> @grounds root/local-date/is-zoned
> @grounds root/checkin/prompt/attempts-start-at-the-send-hour
> @grounds root/checkin/prompt/reuses-one-prompt-until-success

# The cron runs every hour and the handler decides whether to send

The trigger is `0 * * * *`. On each firing the handler reads the local hour and stops before the
send hour. At or after that hour, it opens one prompt for the local date. It stops if a returned
send is already recorded, and otherwise attempts the prompt.

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

The handler runs many times for each email it sends, so it must reuse one prompt. The local-date
key provides that property. A failed attempt remains unsent, so the next hourly fire retries the
same token until one returns or the local date ends.

It also means every question about "which day is it" is a question about the configured time
zone, never about UTC and never about the Worker's own clock. That is one function, and it is
worth testing at a daylight-saving boundary specifically.

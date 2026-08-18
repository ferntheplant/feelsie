# Check-in Catalog

> @claim root/checkin/form/get-does-not-write
> @kind capability

A GET to a prompt link never writes. Only POST records measures.

> @claim root/checkin/prompt/is-sent-once-per-local-date
> @kind capability

However many times the scheduled handler runs, at most one prompt is created for a local date,
and at most one send returns for it.

> @claim root/checkin/prompt/is-sent-at-the-send-hour
> @kind capability

A prompt is sent at the configured send hour, and never before it. It is sent at a later hour of
the same local date only when an earlier send failed.

> @claim root/checkin/prompt/records-a-failed-send
> @kind capability

When a send fails, the handler records the failure and does not mark the prompt sent. A prompt
marked sent is one whose send returned.

> @claim root/checkin/routes/expose-no-history
> @kind capability

The check-in Worker serves no route that returns any entry other than the one the presented
token authorises.

> @claim root/checkin/email/sender-follows-the-configured-domain
> @kind capability

Every address the Worker sends from is constructed from the configured mail domain. No email
address appears as a literal anywhere in the Worker.

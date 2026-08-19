# Check-in Catalog

> @claim root/checkin/form/get-does-not-write
> @kind capability

A GET to a prompt link never writes. Only POST records measures.

> @claim root/checkin/prompt/reuses-one-prompt-until-success
> @kind capability

Every send attempt for a local date uses one prompt. Once a returned send is recorded, later
scheduled fires make no further attempts.

> @claim root/checkin/prompt/attempts-start-at-the-send-hour
> @kind capability

The first scheduled fire at or after the configured send hour attempts the prompt, and no earlier
fire does. Failed attempts retry on later fires until one returns or the local date ends.

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

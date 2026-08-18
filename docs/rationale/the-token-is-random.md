> @grounds root/token/cannot-be-guessed
> @grounds root/token/authorises-one-date
> @grounds root/token/survives-answering
> @grounds root/prompt/expires-after-seven-days

# The token is random and stored, not signed

A token is 32 bytes from `crypto.getRandomValues`, encoded as base64url and written to the
database beside its prompt.

Thirty-two bytes give the token 256 bits of entropy. Base64url keeps the token compact and safe
inside a URL without padding or escaping. `Math.random` is forbidden separately because a test
that observes Web Crypto cannot prove that another token path never uses a weak source.

The rejected option was an HMAC over the local date. It is stateless and it needs no row, which
is genuinely attractive for a system whose whole database is two tables.

It was rejected because a signature cannot be taken back. You cannot cancel an HMAC, and you
cannot expire one without consulting a database — so the moment you want either behaviour you
have re-introduced the row you were avoiding, and now you have a signature scheme **and** a
table. The database already exists here for the entries. Given that, the random token is both
simpler and stronger, and the trade normally made for statelessness has nothing to buy.

## Why the token may be used more than once

Answering a prompt does not consume its token. You will drag a slider wrong on a telephone, and
the repair has to be "open the same link again", because that is the only affordance the email
gives you.

This is why `answered_at` records that you replied but never revokes anything.

## Why the expiry is seven days and not one

A prompt you answer on Thursday for Tuesday is worth more than a gap. One day of validity would
be tidier and would throw away real data every time life interrupted.

## Consequences

The token is the only protection on the check-in form, so the permission it carries is kept
small deliberately: with a token you may write the three measures for one local date. It reads
nothing, and it reaches no other date. A leaked token buys a stranger one false entry on one
day, and that is an acceptable worst case — which is the argument that lets the form stay open
at all.

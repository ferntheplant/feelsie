# Gotchas

Unintuitive behaviour of the tools this project sits on. Read this before you debug something
that looks broken.

Nothing here is a claim. A claim is something the codebase promises and a witness can falsify;
these are facts about somebody else's product that no amount of correct code will change.

## Cloudflare Email

**Mail sent through the `send_email` binding shows as _dropped_ in the Email Routing summary.**
The mail was delivered. Email Routing is reporting on inbound routing and is counting a message
it did not route. Use the email sending metrics and the Worker logs to confirm a send; the
routing summary will never agree with them.

**The `from` and `to` addresses are both constrained, and a mismatch is a send failure, not a
warning.** `from` must be an address on the onboarded subdomain. `to` must be an address
Cloudflare has verified as a destination address. Either one wrong, and the send throws.

**Mail to a verified destination address is free** and does not count against the sending quota
or the daily limit. This is why the design never worries about volume.

## Cloudflare Workers

**Email handlers and Workers run under the standard CPU and memory limits.** The Workers Paid
plan is required; this is not a case where the free plan is merely slower.

## Oxlint and Vite+

**Oxlint is not pinned in this repository, and it sits exactly at the version the Effect linter
requires.** It arrives transitively through `vite-plus`, currently at 1.77.0 against a floor of
1.77.0. A Vite+ downgrade takes the type-aware rules with it, and the symptom is rules quietly
not firing — no error, no failed build. If a lint rule you expect to deny stops denying, check
the installed Oxlint version before you check your code.

**`oxlint --version` refuses to answer.** The binary in `node_modules/.bin` is an IDE wrapper for
`--lsp` mode. Read the version from `pnpm-lock.yaml` or from `node_modules/.pnpm/` instead.

## DNS

**A DNS change can take up to 24 hours.** Five to fifteen minutes is typical, and the tail is
long enough that "it did not work" and "it has not propagated" are indistinguishable for the
first hour. Wait before you change anything a second time.

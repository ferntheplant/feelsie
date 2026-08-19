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

**The Effect integration patches installed Oxlint files.** The root `prepare` script reapplies
the patch after each install. If an Effect rule stops denying code, run `vp install` before you
debug the rule configuration.

**The supported versions have no independent upgrade path.** The catalog pins `@effect/tsgo`,
Oxlint, TypeScript, and `oxlint-tsgolint` to one supported set. Upgrade them as a set. The patch
command rejects an unsupported combination before it changes the integration.

**An `overrides` entry replaces a rule's options; it does not merge them.** A package-scoped
`no-restricted-imports` silently drops whatever the base configuration set — so the repository's
`../**` ban stopped applying inside `apps/checkin` the moment that package got its own entry for
the same rule, and nothing reported it. Repeat every option you still want. This is the failure
mode a lint witness is most exposed to, because it looks exactly like passing.

**There is no `no-restricted-syntax`.** Every restriction rule Oxlint 1.77.0 ships keys on an
identifier — `no-restricted-imports`, `no-restricted-properties`, `no-restricted-globals`,
`no-restricted-exports` — and none of them can match a string literal. A rule about the _shape of
a value_ has to be a JS plugin; [`tools/lint/plugin.ts`](../tools/lint/plugin.ts) is this
repository's.

**`oxlint --version` refuses to answer.** The binary in `node_modules/.bin` is an IDE wrapper for
`--lsp` mode. Read the version from `pnpm-lock.yaml` or from `node_modules/.pnpm/` instead.

## DNS

**A DNS change can take up to 24 hours.** Five to fifteen minutes is typical, and the tail is
long enough that "it did not work" and "it has not propagated" are indistinguishable for the
first hour. Wait before you change anything a second time.

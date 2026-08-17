# Proposed amendments

An amendment is the set of claim changes that one unit of work proposes. It is the
specification. Its operations are **add**, **change**, and **delete**; every entry names a
claim, and an add also names the witness that will attest it.

All of these are **proposed**. An amendment is enacted by the merge, and nothing has merged.

## Sequence

| #                                  | Unit                           | Project     | Gated by |
| ---------------------------------- | ------------------------------ | ----------- | -------- |
| [001](./001-the-core.md)           | config, tokens, dates, entries | `core`      | —        |
| [002](./002-the-checkin-worker.md) | cron, form, mail               | `checkin`   | 001, F1  |
| [003](./003-the-dashboard.md)      | history and statistics         | `dashboard` | 001, F7  |
| [004](./004-the-backup.md)         | D1 → R2                        | `checkin`   | 002      |

The order is not arbitrary. 001 holds every promise that can be judged with no Cloudflare, no
network, and no emulator — which is most of them. Building it first means the majority of the
catalog is affirmed by ordinary tests before any infrastructure question is asked.

## Why 001 is not "the Worker"

`ABSTRACT.md` described two Workers and a database, and the natural first move is to build one
of them. Assigning witnesses first says otherwise: a promise about token shape, local-date
arithmetic, expiry, or upsert semantics does not need a Worker to be judged, and putting it
inside one makes it need an emulator forever.

The seam is not an aesthetic choice here. It is the difference between a catalog whose claims
are affirmed by `vp test` and one whose claims are affirmed by a deployment.

## What is not here

**There is no infrastructure amendment.** An earlier draft had one: the apex MX records, the
Access application on the dashboard hostname, the rate-limit rule. It was deleted, because a
claim's state must be rederivable from the repository alone and none of those three is. They are
infrastructure monitoring, which is a different problem — scheduled rather than diff-triggered,
and with no pull request to attach a verdict to. See
[`CRUX-FEEDBACK.md` C1](../CRUX-FEEDBACK.md#c1--a-claims-subject-must-be-rederivable-from-the-repository--settled).

They have not been forgotten. They are steps in
[`docs/runbooks/onboard-the-mail-subdomain.md`](../../docs/runbooks/onboard-the-mail-subdomain.md),
and the risk they carry is real — it is simply not a risk crux is shaped to catch.

A `wrangler` command is still a legitimate witness when it runs **fully locally** — `wrangler
dev`, `--local`, `deploy --dry-run`. Those read repository configuration and ask Cloudflare
nothing, so their answer is rederivable from a checkout. Every test in 002 and 004 runs that way.

## No `root/` claims yet

The repository root is a project like any other when it holds claims of its own, and here it is
called `root` (crux spells it `workspace`; see [C12](../CRUX-FEEDBACK.md)).

It holds nothing today. Every claim here belongs to `core`, `checkin`, or `dashboard`.

The repository's house rules are all `@kind development` claims waiting to be written, and F11
settled what they will be: Effect-native patterns, carried by the Effect linter's rule ids. They
are still deferred, but the reason changed — it is sequencing now, not doubt. Writing them needs
the rules turned on, and turning them on needs [F13](../fog.md) answered.

One of them is already identifiable and is not an Effect rule: the type-aware lint pipeline must
be available at all, since the whole mechanism rests on an Oxlint version this repository does
not pin. See [C15](../CRUX-FEEDBACK.md).

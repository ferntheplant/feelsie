# Proposed amendments

An amendment is the set of claim changes that one unit of work proposes. It is the
specification. Its operations are **add**, **change**, and **delete**; every entry names a
claim, and an add also names the witness that will attest it.

An amendment is enacted by the merge. **001, 005, and 002 are enacted; 003, 004, 006, and 007 are
proposed.**

## Sequence

| #                                           | Unit                           | Package                                    | Gated by |
| ------------------------------------------- | ------------------------------ | ------------------------------------------ | -------- |
| [001](./001-the-core.md)                    | config, tokens, dates, entries | `packages/core`                            | —        |
| [005](./005-the-altitude-correction.md)     | six claims become two          | `packages/core`                            | —        |
| [002](./002-the-checkin-worker.md)          | cron, form, mail               | `apps/checkin`                             | 001      |
| [003](./003-the-dashboard.md)               | history and statistics         | `apps/dashboard`                           | 001, F7  |
| [004](./004-the-backup.md)                  | D1 → R2                        | `apps/checkin`                             | 002      |
| [006](./006-the-declared-infrastructure.md) | Access, DNS, mail, rate limit  | the root, `apps/checkin`, `apps/dashboard` | Alchemy  |
| [007](./007-the-house-rules.md)             | the house rules, as claims     | the root                                   | —        |

**There is one project and the column does not name it.** Every claim in the repository carries
the `root/` prefix — see [`ONE-PROJECT.md`](../ONE-PROJECT.md). What differs between amendments is
which package the work lands in, which is a deployment fact and not a crux one.

The order is not arbitrary. 001 holds every promise that can be judged with no Cloudflare, no
network, and no emulator — which is most of them. Building it first means the majority of the
catalog is affirmed by ordinary tests before any infrastructure question is asked. It merged as
`feat(core): implement core package (#3)`, so its claims are live and 005 amends them rather than
proposing them.

005 is out of numerical order on purpose. It was gated by nothing and it gated nothing, but it
corrected the altitude of `core`'s catalog, and 002 and 003 are read against that catalog. It
merged as `fix(core): align claims with reader-visible failures (#5)`.

## 002 is enacted, and it carried the seam

002 merged with the check-in Worker: `apps/checkin`, six claims in
[`docs/catalog/checkin.md`](../../docs/catalog/checkin.md), and the capability seam described
below. One of its claims was reworded at the merge on an operator's ruling — the retry gate —
and the amendment records what moved.

**003 inherits the seam, and inherits two things nobody predicted.** `packages/core` now exposes
`PromptRead`, `PromptWrite`, `EntryRead`, and `CheckIn` instead of `Database`; the SQL interface
moved to `@feelsie/core/database` so a lint rule has an entrypoint to deny; and the package's
`exports` point at source rather than `dist`, because `vp run ready` tests before it builds. The
dashboard's `listEntries` must land on a service the check-in Worker never receives — a lint rule
under `apps/checkin/**` already denies the name.

## 002 and 003 were revised after 005

They were written before crux had §5.8 (coverage) or §5.9 (group by the failure a reader can
see), and they carried the fingerprint 005 corrected in `core`: **every add named exactly one
witness**. Their claims were already at reader-visible altitude and every one of them survived —
two renamed, one reworded, none deleted or split. What moved is the witness side. Each add now
names a set and argues its coverage, and the pair of cron claims had its witnesses re-cut so that
neither is proved only by a marker the other shares (crux §5.7).

Two of their claims take a **type** witness that is not representable against `core` as built:
`DatabaseShape` takes arbitrary SQL on both methods, so a handle narrowed to `first` still
writes through `INSERT … RETURNING`. Closing that means `core` exposes narrow capability services
instead of one `Database`. **That seam carries no claim**, so it belongs to no amendment; it
lands in whichever of 002 and 003 merges first, and the other inherits it.

**004 has now been revised too.** It was the last amendment written under the retracted rule, and
it carried the fingerprint in the worst place: its claim led with the R2 write while its own prose
said the restore leg was the claim. The claim now leads with the restore and says _exactly_ rather
than _containing_, the witness set uses R2's read/write split, and F1's silence finding added a
second claim. `wrangler dev --local` is gone from its witnesses along with everything else that
named a tool this repository does not have.

## Why 001 is not "the Worker"

`ABSTRACT.md` described two Workers and a database, and the natural first move is to build one
of them. Assigning witnesses first says otherwise: a promise about token shape, local-date
arithmetic, expiry, or upsert semantics does not need a Worker to be judged, and putting it
inside one makes it need an emulator forever.

The seam is not an aesthetic choice here. It is the difference between a catalog whose claims
are affirmed by `vp test` and one whose claims are affirmed by a deployment.

## The infrastructure amendment came back

An earlier draft of this set had one: the apex MX records, the Access application on the dashboard
hostname, the rate-limit rule. F10 deleted it, because a claim's state must be rederivable from the
repository alone and none of those three was. See
[`CRUX-FEEDBACK.md` C1](../CRUX-FEEDBACK.md#c1--a-claims-subject-must-be-rederivable-from-the-repository--settled).

**006 is that amendment, rewritten.** F10 is refined rather than reopened: a claim about _live_
infrastructure still does not belong in the catalog, and a claim about _declared_ infrastructure
does. F10 could not draw that line because with no IaC there was no declaration to draw it around,
so what it recorded as a principle was a property of the tooling.

The runbook keeps every step. What 006 adds is a claim beside each one, and drift between the two
remains monitoring that nothing here detects.

A `wrangler` command is still a legitimate witness when it runs **fully locally** — `wrangler
dev`, `--local`, `deploy --dry-run`. Those read repository configuration and ask Cloudflare
nothing, so their answer is rederivable from a checkout. Every test in 002 and 004 runs that way.

## 006 holds the first claim about the repository itself

`root` was chosen as the name of the repository-root project, back when four projects were
planned. Crux adopted the same word and recorded `workspace` as rejected, so the two agree; see
[C12](../CRUX-FEEDBACK.md) for how that was settled. It is now the prefix of the **only** project,
which [`ONE-PROJECT.md`](../ONE-PROJECT.md) settled and this repository has enacted.

What survives that collapse is a question about the `<path>` segment rather than the prefix. Every
claim in the catalog today has a package to point at. `root/dns/apex-mail-is-declared` is the
first that does not: the zone belongs to no package, because both hostnames live in it and the
apex records concern mail that has nothing to do with this project.

**That claim is `@kind capability`, which [C11](../CRUX-FEEDBACK.md) left room for and did not
expect.** C11 predicted the root would hold mostly development-kind claims and was careful to call
that a correlation rather than an identity. The first claim about the repository itself is the
exception, not the rule it predicted.

## The house rules stopped being deferred

They were `@kind development` claims "waiting to be written" for three revisions of this file, on
a reason that kept shrinking: F11 settled what they would be (Effect-native patterns, carried by
the Effect linter's rule ids), F13 confirmed the lint path end to end, and C15 established that
each rule is a witness for the cost of one comment. What was left was sequencing.

[007](./007-the-house-rules.md) is them, and **it is the only amendment in this table with no
gate.** Every other one waits on A002, A003, or an Alchemy phase; this one waits on nothing, and
three of its four witnesses are lint rules that are already enabled and already denying. C15's
fourth claim — the type-aware pipeline is available — is in it, and is the only part that needs
new code.

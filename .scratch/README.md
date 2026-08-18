# `.scratch/` — the makeshift tracker

Crux has no tooling yet, and cairn does not exist. This directory is the hand-built stand-in
for both, and the friction of maintaining it is the point: it is the input to cairn's design.

Nothing here is durable. Nothing here is a claim.

## Why it exists at all

The catalog is present tense. A claim enters in the merge that makes it true. Unimplemented
promises need a separate home, which this directory provides.

Crux says there are exactly two states outside the catalog, and this directory is one file for
each:

| State                  | Can you write the claim? | Here                           | Exits by                    |
| ---------------------- | ------------------------ | ------------------------------ | --------------------------- |
| **fog**                | no                       | [`fog.md`](./fog.md)           | human judgment, or evidence |
| **proposed amendment** | yes                      | [`amendments/`](./amendments/) | the merge that enacts it    |

An amendment is normally held by the branch doing the work. Belay does not exist, so the drafts
also sit here. That substitution is itself a finding. See [`FOG-LOG.md`](./FOG-LOG.md).

## Reading order

1. [`fog.md`](./fog.md) — what is not yet answerable, and what each item blocks.
2. [`amendments/`](./amendments/) — what is answerable, in the order it should be built.
3. [`FOG-LOG.md`](./FOG-LOG.md) — where this hurt, which is the deliverable for cairn.

The plan documents alongside them — [`ALCHEMY-MIGRATION.md`](./ALCHEMY-MIGRATION.md),
[`ONE-PROJECT.md`](./ONE-PROJECT.md) — are neither fog nor amendments. They hold work that is
decided and unbuilt, and that changes no claim's truth when it lands.

## Rules while this is by hand

- **A slug written here and a slug written in `docs/rationale/` must match, and nothing checks
  that.** Crux would. Until it does, grep before you rename.
- **Promote nothing into `docs/catalog/` ahead of a witness.** The affirmed catalog is the
  invariant this exercise tests.
- **When an item stops being fog, say what cleared it** — judgment or evidence. Which of the two
  does more work is one of the things this experiment is measuring.

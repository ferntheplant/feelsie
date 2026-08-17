# `.scratch/` — the makeshift tracker

Crux has no tooling yet, and cairn does not exist. This directory is the hand-built stand-in
for both, and the friction of maintaining it is the point: it is the input to cairn's design.

Nothing here is durable. Nothing here is a claim.

## Why it exists at all

The catalog is present tense — a claim is in it only when a sound witness affirms it, and it
enters in the merge that makes it true. Feelsie has no code, so the catalog is empty and must
stay empty. But `ABSTRACT.md` was full of promises, and those promises have to go somewhere
that is not the catalog.

Crux says there are exactly two states outside the catalog, and this directory is one file for
each:

| State                  | Can you write the claim? | Here                           | Exits by                    |
| ---------------------- | ------------------------ | ------------------------------ | --------------------------- |
| **fog**                | no                       | [`fog.md`](./fog.md)           | human judgment, or evidence |
| **proposed amendment** | yes                      | [`amendments/`](./amendments/) | the merge that enacts it    |

An amendment is normally held by the branch doing the work. There is no branch and no belay, so
the drafts sit here until there is one. That substitution is itself a finding — see
[`FOG-LOG.md`](./FOG-LOG.md).

## Reading order

1. [`fog.md`](./fog.md) — what is not yet answerable, and what each item blocks.
2. [`amendments/`](./amendments/) — what is answerable, in the order it should be built.
3. [`FOG-LOG.md`](./FOG-LOG.md) — where this hurt, which is the deliverable for cairn.

## Rules while this is by hand

- **A slug written here and a slug written in `docs/rationale/` must match, and nothing checks
  that.** Crux would. Until it does, grep before you rename.
- **Do not promote anything into `docs/catalog/` ahead of a witness.** The empty catalog is the
  invariant this whole exercise is testing.
- **When an item stops being fog, say what cleared it** — judgment or evidence. Which of the two
  does more work is one of the things this experiment is measuring.

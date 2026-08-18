# Collapsing to one slug prefix

**Status**: decided, not done · **Changes no claim's truth** · **Do it before A002 is written**

Feelsie is one crux project — the rule is in [`CRUX.md`](../CRUX.md), and the reasoning is that
core, check-in, and dashboard are three deliverables of one product, sharing one set of
requirements and one vocabulary. Nothing here re-argues that. This document is the work the
decision leaves behind: four slug prefixes were written on the assumption of four projects, and
they have to become one.

## What is spent, and where

| Prefix       | Distinct slugs  | Homes                                                                |
| ------------ | --------------- | -------------------------------------------------------------------- |
| `core/`      | 10, **enacted** | `docs/catalog/core.md`, 4 rationales, 4 test files, `vite.config.ts` |
| `checkin/`   | ~11, proposed   | A002, A004, A006                                                     |
| `dashboard/` | ~4, proposed    | A003, A006                                                           |
| `root/`      | 1, proposed     | A006                                                                 |

The proposed ones are free — an amendment is a draft until the merge that enacts it. The ten
enacted ones are not: a slug is stable by design, markers cite it, and rationales ground it.

## The open question: which name

The prefix has to describe the product, because with one project it names every claim in the
repository. None of the three incumbents does:

- **`core`** names a package. `core/dashboard/shows-the-history` reads as a category error.
- **`root`** names a position. It is [C12](./CRUX-FEEDBACK.md)'s word for the repository-root
  project, chosen on its merits for that job, and that job disappears when there is only one.
- **`feelsie`** names the product. `feelsie/token/cannot-be-guessed` and
  `feelsie/checkin/sends-one-email-a-day` both read correctly, with the old prefixes demoted to
  the `<path>` segment, which is where a subsystem belongs.

`feelsie` is the reading that works; it is written here as the likely answer rather than as a
settled one, because it costs ten enacted renames and the operator has not ruled.

## Sequence, when it is done

1. Pick the name.
2. Rename the enacted ten: `docs/catalog/core.md`, the four rationales that `@grounds` them, the
   four test files that `@attests` them, and the marker block in `vite.config.ts`. Grep first —
   [`.scratch/README.md`](./README.md) is explicit that nothing checks slug agreement by hand.
3. Refile the proposed prefixes in the amendments, `checkin/x` becoming `<name>/checkin/x`.
4. Delete `packages/core/GLOSSARY.md`'s `@project core` — **last**, because until step 2 lands
   it is what keeps the enacted slugs from being misfiled.
5. **Do not rewrite [`FOG-LOG.md`](./FOG-LOG.md) or [`CRUX-FEEDBACK.md`](./CRUX-FEEDBACK.md).**
   They are dated records of what happened, and what happened used the old slugs. Editing them
   to agree with the present would falsify the only data this project exists to produce.

## Why the deadline

Every amendment written before this lands adds slugs to step 3, and A002 is the largest one
outstanding. The cost is monotonic and there is no reason to pay more of it.

## Why it is not in this branch

`build: adopt alchemy` leaves `docs/catalog/` byte-identical on both sides, which is the property
that makes it reviewable as a build change. A rename of every enacted slug is the opposite kind of
change and deserves its own diff.

# Collapsing to one slug prefix

**Status**: done · **Changed no claim's truth** · **Ruling**: the prefix is `root`

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

## The ruling: `root`

**The operator ruled for `root`.** The argument below is kept as written, including the case for
`feelsie`, because the ruling went against the reading this document proposed and that is the more
useful record. What the ruling buys: the root [`GLOSSARY.md`](../GLOSSARY.md) already declared
`@project root`, so the collapse cost no glossary edit and no new word — the one prefix that was
already real became the only one.

`core/` did not survive as a `<path>` segment. It named a package, and the other three named
subsystems, so `core/token/cannot-be-guessed` became `root/token/cannot-be-guessed` while
`checkin/form/get-does-not-write` became `root/checkin/form/get-does-not-write`. That asymmetry is
in the sequence below and it is deliberate: `token`, `entry`, `prompt`, `local-date`, and `config`
are already subsystems, and `root/core/token/…` would have named the package twice.

## The open question, as it stood

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

## Sequence, as it was done

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

### Three homes the sequence did not list, and all three had to move

The grep in step 2 found two of them, which is the argument for the grep. It missed the third,
which is the argument for a stronger check than a grep.

- **[`packages/core/migrations/0001_core.sql`](../packages/core/migrations/0001_core.sql)** holds
  two schema witnesses — `PRIMARY KEY` attesting `root/entry/one-per-local-date`, and the three
  `CHECK` constraints attesting `root/entry/measures-are-one-to-ten`. The table above counts "four
  test files"; the fifth home is a `.sql` file, and it is the only witness in the repository that
  is neither TypeScript nor Markdown. **No grep with a file-type filter finds it.** What found it
  was resolving every `@attests` against every `@claim` and listing what did not resolve — the
  **orphaned** form check, run by hand, after the work looked finished.
- **[`CRUX.md`](../CRUX.md)** carried a paragraph — _"The prefixes have not caught up"_ — whose
  whole subject was this document being unfinished, plus five example slugs citing real claims.
  It is the operational rules file and it is read before every claim is written, so a stale
  prefix there propagates into the next thing anybody writes.
- **[`amendments/README.md`](./amendments/README.md)** had a `Project` column that is now `root`
  in every row, and a section titled _"`root/` gets its first claim in 006"_ that the collapse
  made false. The column became `Package`, and the section is now about the `<path>` segment,
  which is the part of the question that survived.

### What the sequence deliberately left alone

Step 5 names two files. Three more are the same kind of thing, and the table at the top of this
document is what says so — it lists the homes of each prefix, and none of these is in it.

- **[`fog.md`](./fog.md)'s cleared items and [`amendments/001`](./amendments/001-the-core.md) and
  [`005`](./amendments/005-the-altitude-correction.md)**, which are enacted. An enacted amendment
  is the record of a merge, and A005's whole content is six slugs that no longer exist. Refiling
  those would claim a rename that never happened.
- **The "renamed from" notes inside A002.** `checkin/exposes-no-history` was a prior name for a
  slug that is now `root/checkin/routes/expose-no-history`. A prior name keeps its prior spelling
  or it stops being a record of anything.

The rule that falls out: **refile a slug that names something live; leave a slug that names
something past.** Nothing checks it, which is [`README.md`](./README.md)'s point.

## Why the deadline

Every amendment written before this lands adds slugs to step 3, and A002 is the largest one
outstanding. The cost is monotonic and there is no reason to pay more of it.

## Why it was not in the alchemy branch

`build: adopt alchemy` left `docs/catalog/` byte-identical on both sides, which is the property
that made it reviewable as a build change. A rename of every enacted slug is the opposite kind of
change and got its own diff.

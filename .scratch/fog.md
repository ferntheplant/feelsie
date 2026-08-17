# Fog

Material we want, and cannot yet state as a claim.

Fog is defined by **inability**, not by absence of effort. A claim you could write but have not
written yet is not fog — it is an unwritten amendment, and it belongs in
[`amendments/`](./amendments/). If that distinction slips, this file becomes a backlog and stops
meaning anything.

Each item names what clears it (**judgment** or **evidence**) and what it blocks. An item is
clear when you can write the claim **and** assign its witness.

## Open

| #         | Item                                                  | Clears by | Blocks                       |
| --------- | ----------------------------------------------------- | --------- | ---------------------------- |
| [F1](#f1) | Does `send_email` work in a `scheduled` handler?      | evidence  | A002                         |
| [F2](#f2) | Can a subdomain be onboarded with the apex MX intact? | evidence  | the runbook, the real domain |
| [F3](#f3) | Does the daily mail land in the inbox?                | evidence  | nothing structural           |
| [F7](#f7) | Line charts, or a calendar heat map?                  | judgment  | statistics in A003           |

---

### F1

**Does `send_email` work inside a `scheduled` handler?** · evidence · blocks A002

The whole check-in Worker rests on one Worker holding both a cron trigger and a send binding. If
that does not work, the shape changes.

Deploy a throwaway Worker with `*/2 * * * *` and a single send. Watch the sending metrics, not
the Email Routing summary ([`docs/gotchas.md`](../docs/gotchas.md)).

Known correction if it fails: the `scheduled` handler calls a `fetch` route on the same Worker
and the send happens there. Worth knowing before it is needed, because it changes what
`checkin/prompt/one-per-local-date` is a claim _about_.

### F2

**Can a subdomain be onboarded with the apex MX records intact?** · evidence · blocks the runbook

Run [`docs/runbooks/onboard-the-mail-subdomain.md`](../docs/runbooks/onboard-the-mail-subdomain.md)
against a domain that carries no email you care about. Compare `dig MX` before and after.

This no longer blocks a claim — the MX records are not rederivable from a checkout, so there is
no claim to block. It blocks touching the real domain, which is a higher bar than any claim in
the tracker.

### F3

**Does the daily mail land in the inbox?** · evidence · blocks nothing structural

Send three. Check spam for all three. If it needs a mail rule, that is a fact about your mail
client and produces no claim — but a system whose mail is silently filtered is a system you stop
using.

### F7

**Line charts, or a calendar heat map?** · judgment · blocks the statistics claims in A003

`dashboard/shows-the-history` can be written without this. Any claim about _statistics_ cannot: a
claim about a heat map and a claim about a line chart are not the same claim.

---

## Cleared

### F13 — Does Effect's Oxlint patch compose with Vite+'s bridge? · cleared by evidence

**Yes.** `@effect/tsgo@0.36.5` patched the Oxlint 1.77.0 binary and the
`oxlint-tsgolint@7.0.2001` bridge that Vite+ 0.2.9 uses. The root `prepare` script reapplies the
patch after each install.

The sample app now depends on `effect@4.0.0-rc.110`. A deliberate floating `Effect.log(...)`
value produced this diagnostic through `vp lint`:

```text
apps/example/src/index.ts:4:3: error effecttsgo(floating-effect): This Effect value is neither yielded nor used in an assignment.
```

After removal of the violation, `vp lint` passed. Oxlint and the Effect rules use one command,
one report format, and one exit status. C15's existing Oxlint adapter path therefore applies.

The experiment corrected one premise. Oxlint rule severities belong in `vite.config.ts`, not
`tsconfig.json`. The TypeScript configuration enables the language service with diagnostics off,
which prevents duplicate reports. All compatibility-sensitive versions are exact catalog pins.

### F5 — Is there a free-text note on the form? · cleared by judgment

**Yes, on day one.** Nullable column in the first migration, claimed by
`core/entry/note-round-trips` in A001.

`ABSTRACT.md` contradicted itself here: §9's schema had a `note` column, and §15 listed the note
field as an open decision that "does not block the first build". It does block it — the column is
in the first migration or it is not, and adding it later is a migration against live data.

That contradiction had gone unnoticed in the source document and surfaced in the act of writing
the exit gate. Recorded as [C7](./CRUX-FEEDBACK.md).

### F4 — What is the send hour? · cleared by judgment

**21:00, as a default.** The hour and the time zone are both configuration.

The claim it was blocking is better for it: it never mentions 21:00, because the number is not
what the system promises. A claim naming the literal hour would need rewording the first time you
moved it, and rewording a claim puts every witness attesting it back into the audit scope.

Cleared into `checkin/prompt/is-sent-at-the-send-hour` and a new
`core/config/is-required`, which exists because a `?? "UTC"` fallback on the time zone would
silently misfile every entry while every date test still passed. F11 later added
`core/config/is-context-service` as the structural half.

### F6 — Does the confirmation page show a chart? · cleared by judgment

**No.** Submission is fire-and-forget. Looking at your history is a deliberate trip to the
dashboard, not a thing that happens to you on the way out of a form.

**This produced no artifact at all**, which is the interesting part. `checkin/exposes-no-history`
already forbids the alternative — a confirmation page rendering the last seven days is a route
returning entries the presented token does not authorise. The fog cleared, the catalog did not
move, and the claim that settled it was written for an unrelated reason. Recorded as
[C13](./CRUX-FEEDBACK.md).

### F12 — Is Vite+'s bundled Oxlint new enough for the Effect linter? · cleared by evidence

**Yes, exactly.** From `pnpm-lock.yaml` and `node_modules`:

| Package           | Installed | Required by `@effect/tsgo` |
| ----------------- | --------- | -------------------------- |
| `oxlint`          | 1.77.0    | >= 1.77.0                  |
| `typescript`      | 7.0.2     | >= 7.0.2                   |
| `oxlint-tsgolint` | 7.0.2001  | —                          |

Better than the question assumed: the type-aware bridge is already installed, and
`vite.config.ts` already runs `typeAware: true`. The pipeline the Effect patch plugs into is
working today rather than waiting to be stood up.

**Cleared by reading a lockfile, and worth noting how cheap that was.** The question had been
posed as "run an experiment"; it was answered in one grep. The tracker had no way to record that
an evidence-gated item might be answerable without running anything.

**What this left behind at the time.**

**No headroom, and no control.** Oxlint sits at exactly the required floor, and it is transitive
through `vite-plus` rather than pinned in the catalog — so a Vite+ downgrade breaks the
lint-witness mechanism silently, by rules quietly not firing rather than by anything failing.
This is the failure mode [C15](./CRUX-FEEDBACK.md) is most exposed to, and it is a candidate
development claim once those are written: _the type-aware lint pipeline is available_, witnessed
by a rule that is expected to deny on a fixture.

**A narrower question survived** as [F13](#f13): the version floor being met was not the same as
Effect's patch composing with the bridge Vite+ ships. F13 later pinned the versions and confirmed
the composition.

### F11 — What are the house rules, and is Effect-ts one? · cleared by judgment

**Effect v4, committed on day one.** The house rules are Effect-native patterns, sourced from the
official [`Effect-TS/skills`](https://github.com/Effect-TS/skills) and the type-aware linter in
[`Effect-TS/tsgo`](https://github.com/Effect-TS/tsgo).

Rationale: [`core-is-written-in-effect.md`](../docs/rationale/core-is-written-in-effect.md).

**The item changed category while being answered.** It entered as a preference about tooling,
attached to a decision to defer boilerplate development claims. It was fog because adopting
Effect moves claims between witness kinds, and a claim's witness kind is part of the claim — so
"which library" was really "what can this catalog promise structurally".

**And clearing it improved the witness situation twice over.**

1. `core/config/is-context-service` carries the type witness. `core/config/is-required` keeps the
   runtime test that rejects a missing value and catches `?? "UTC"`.
2. The development claims deferred in this item now have witnesses waiting for them. The Effect
   linter ships ~80 rules and emits them as Oxlint type-aware rules, so each rule this project
   turns on is a lint witness with no adapter work and no custom rule. The marker goes on the
   severity entry in `vite.config.ts`. Recorded as [C15](./CRUX-FEEDBACK.md).

Deferring those claims still stands. What changed is that they are now cheap and chosen rather
than expensive and inherited, so the reason to defer is sequencing rather than doubt.

`floatingEffect` guards Effect programs. The promise rule remains for test and runtime adapters
that call `Effect.runPromise`.

Left open as [F12](#f12): whether Vite+'s bundled Oxlint is new enough to carry the rules.

### F8 — What are the packages? · cleared by judgment

`packages/core`, `apps/checkin`, `apps/dashboard`, and `root` for the repository itself — which
holds no claims yet (F11). Crux spells that last one `workspace`; feelsie uses `root`
([C12](./CRUX-FEEDBACK.md)).

**Discharged into a rationale, not a claim** — nothing can violate a package layout, so there is
nothing for a witness to check. That is crux's minority exit from fog, and it happened on the
first item to need it.

### F10 — Do the infrastructure claims belong in the catalog? · cleared by judgment

**No. They do not get to exist.** A claim's state must be rederivable from the repository alone.
The apex MX records, the Access applications, and the rate-limit rule are none of them, so they
are infrastructure monitoring — a different problem, scheduled rather than diff-triggered, with
no pull request to attach a verdict to.

A `wrangler` command remains a legitimate witness when it runs **fully locally**, because that
reads repository configuration and asks Cloudflare nothing.

This deleted amendment 003 entirely and cut `checkin/email/from-is-onboarded` in half. It is the
most consequential ruling of the exercise and the one with the clearest cost: see
[C1](./CRUX-FEEDBACK.md) for the argument and
[`amendments/004-the-backup.md`](./amendments/004-the-backup.md) for what it gives up.

### F9 — Which domain? · cleared by judgment

**It stays out of the repository.** Documentation says `example.com`; the real domain is
configuration, handled like a secret, because this repository is public.

That killed a second draft of the email claim — the domain is not in a checkout, so no witness
can compare an address against it. What replaced it is a claim about the mechanism rather than
the value: no address is a literal, every address is built from the configured domain. Stronger
than what it replaced, and arrived at by constraint rather than by choice
([C14](./CRUX-FEEDBACK.md)).

The domain is still needed to _run_ F2, and running F2 is still gated on having somewhere safe to
rehearse it. That is an operational prerequisite, not fog: nothing about it is unstatable.

# Crux implementation findings

This file records friction from implementation work. It complements `CRUX-FEEDBACK.md`, which
records findings from claim and framework design.

| #   | Finding                                                       | Status  | Class    |
| --- | ------------------------------------------------------------- | ------- | -------- |
| I1  | a negative lint witness does not prove a positive source      | settled | thinking |
| I2  | required configuration spans compile and runtime availability | settled | thinking |
| I3  | claim counts and cross-references drift before implementation | repeat  | clerical |
| I4  | a green canvass can still contain false markers               | settled | review   |
| I5  | a witness must be shown to deny before it is believed         | settled | thinking |
| I6  | the seam a claim needs is larger than the claim               | settled | thinking |
| I7  | the gate's own order constrains how packages resolve          | settled | clerical |

## I1 - A negative lint witness does not prove a positive source

A001 claimed that token bytes came from a CSPRNG. Its lint witness only prohibited
`Math.random`. The witness allowed a custom weak generator and therefore did not attest the
claim.

Implementation split the property again. A test observes `crypto.getRandomValues` on the
production path. A separate lint claim prohibits `Math.random`. The output-shape test remains a
third claim.

This confirms Crux section 5.8. It also shows that a negative witness cannot prove a positive
mechanism.

## I2 - Required configuration spans two kinds of availability

The first two-way split separated required configuration from validated configuration. The
required claim still used a type witness and a test witness.

The type witness proves that core operations require the Effect context service. The test proves
that the environment decoder rejects an absent value. Neither proves the other property.

An independent audit marked every mixed marker false. The operator then approved
`core/config/is-context-service` as a third claim. Each property now has one witness kind.

## I3 - Claim counts and cross-references drift before implementation

The log said that A001 contained ten claims. The amendment contained eleven before the build and
fourteen after the approved splits.

The same claim slugs also lived in the amendment, rationale groundings, and final catalog.
Updating them was clerical work. This repeats C4 from an implementer's position.

## I4 - A green canvass can still contain false markers

The first implementation passed every test and the repository gate. An independent audit marked
six claims red because at least one marker did not attest its full claim.

The tests needed adversarial cases: known Web Crypto bytes, a second configured zone, the exact
expiry boundary, refusal side effects, and every constrained measure. A second audit found one
remaining lower-bound gap in send-hour validation.

This is not a Crux defect. It confirms the separation between verdict and standing, and the rule
that the builder cannot audit its own witness.

## I5 - A witness must be shown to deny before it is believed

Five of A002's witnesses are structural: two type assertions, two lint denials, and the
carried-forward `../**` pattern. All five passed on the first run. Four of them would have passed
if they had been doing nothing at all.

So each was deliberately broken and re-run: a write added to the GET handler, a `listEntries`
import written, an email literal pasted in, a `list` operation added to the entry-reading service,
a parent import written. Four of the five denied. The fifth — `../**` inside `apps/checkin` — did
**not**, because Oxlint replaces a rule's options in an override rather than merging them, so the
package-specific `no-restricted-imports` had silently dropped the base configuration's patterns.

That is the whole finding: **the one that was broken was the one nobody would have thought to
check**, and it was found only because the check was applied to all five rather than to the ones
that looked risky. C27 already names the class — a witness can stop firing without anything
failing — and this is that class arriving inside a single pull request rather than after a
dependency upgrade.

Cheap and mechanical, and it belongs in the build rather than in the audit: a builder can break
their own witness and watch it fire without any of the independence an audit needs.

## I6 - The seam a claim needs is larger than the claim

A002 and A003 both said the capability seam "carries no claim of its own" and would land in
whichever merged first. That is true and it undersells the work by a lot.

Building it moved `Database` off `packages/core`'s index, rewrote every one of `core`'s existing
witnesses to go through capability services, rebuilt the `prompts` table so a prompt could exist
unsent, dropped `expires_at` in favour of a derived value, changed the package's `exports` to
resolve from source, and added a migration. None of it changed a claim. All of it was required
before two of A002's six could be witnessed at all.

The amendment is a specification of claims, and there is no artifact for the production work a
specification implies. Crux is right that this work carries no claim — nothing about a service
split is falsifiable that the claims do not already say. But "carries no claim" was read, by the
document that wrote it, as "is small", and the two are unrelated.

What would have helped is not a new artifact but a line in the amendment: **name the seam and say
what it displaces.** A002 named it and described only the type it enables.

## I7 - The gate's own order constrains how packages resolve

`vp run ready` is `vp check && vp run -r test && vp run -r build`. `apps/checkin` depends on
`@feelsie/core`. On a clean checkout, `packages/core/dist` does not exist when `check` and `test`
run, so a package `exports` pointing at `dist` makes the gate fail on its own ordering — before
any code is wrong.

The fix is one line: `exports` resolves to `./src/*.ts`. Everything in this repository is
TypeScript, `packages/core` is private and never published, and the `build` script stays as a
check that the package packs rather than as the thing consumers use.

Clerical, but worth recording because the failure is confusing: the error is a module-resolution
failure in an app, and the cause is the order of three words in a script somewhere else.

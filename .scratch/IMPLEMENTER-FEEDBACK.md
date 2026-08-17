# Crux implementation findings

This file records friction from implementation work. It complements `CRUX-FEEDBACK.md`, which
records findings from claim and framework design.

| #   | Finding                                                       | Status  | Class    |
| --- | ------------------------------------------------------------- | ------- | -------- |
| I1  | a negative lint witness does not prove a positive source      | settled | thinking |
| I2  | required configuration spans compile and runtime availability | settled | thinking |
| I3  | claim counts and cross-references drift before implementation | repeat  | clerical |
| I4  | a green canvass can still contain false markers               | settled | review   |

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

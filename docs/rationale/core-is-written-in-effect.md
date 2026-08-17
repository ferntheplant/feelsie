> @grounds core/config/is-context-service
> @grounds core/config/is-required

# The core is written in Effect

`packages/core` — tokens, local dates, configuration, and the entry table — is written in
Effect v4. The Workers on top of it are too.

The rejected option was plain TypeScript with a small hand-rolled result type, or with plain
exceptions. For an application this size that is the obvious choice, and it is worth saying why
it lost, because nobody would guess the reason from the application.

## The application does not justify this

Feelsie has two tables, three numbers, and one user. Effect is a large dependency for that, it
is a real ramp for anyone who has not written it before, and it costs bundle size on a Worker
where bundle size is metered. Judged as a mood tracker, this decision is overkill and the
plain-TypeScript version would have shipped sooner.

## The catalog does

What tips it is that **the witness kind is part of the claim**, and Effect moves claims up the
ladder that would otherwise sit in tests forever.

- Configuration. A context service makes the requirement structural, so a configured operation
  cannot run without its layer. A separate test rejects absent runtime values and catches a
  fallback such as `env.TZ ?? "UTC"`.
- Failure. "An expired token is refused" is a test when failure is an exception and a much
  smaller test when failure is in the signature — the type says which errors a function can
  produce, and the compiler says whether the caller handled them.

The implementation split configuration into context structure, runtime presence, and value
validation. Each part now sits at the highest honest witness kind.

The general form: an exception is invisible to the type system, so every claim about failure
behavior needs a test. A typed error channel makes some claims structural. Crux pushes each claim
as far up that ladder as it honestly goes.

## And the house rules arrive with witnesses attached

The second reason is more specific and it is the one that decided it. The Effect team ships a
type-aware linter with roughly eighty rules, and it emits them as Oxlint type-aware rules.

A lint witness is a marker on the line that declares a rule id, and the join is a dictionary
lookup on that id. So each rule this project turns on becomes a witness with **no adapter work,
no custom rule, and no test that reads a config file** — the marker sits on the severity entry
in `vite.config.ts`.

The alternative was writing the same rules by hand, one custom Oxlint rule at a time, and each
one is a small project with its own bugs. That is the true cost being avoided, and it is
invisible if you evaluate Effect purely as a runtime library.

## Consequences

**Effect values and promises have separate guards.** `floatingEffect` guards application
programs. The promise rule remains for test runners and runtime adapters that call
`Effect.runPromise`.

**The toolchain meets the requirements, with no margin.** The linter needs Oxlint 1.77.0,
TypeScript 7.0.2, and `oxlint-tsgolint` 7.0.2001. The catalog pins all three exact versions.

F13 confirmed that Effect's patch composes with the bridge Vite+ ships. `vp lint` emitted an
`effecttsgo/floating-effect` denial from the sample app. The root `prepare` script reapplies the
patch after each install, and the patch validates the supported versions before replacement.

**This is a day-one decision on purpose.** Adopting Effect after `packages/core` exists means
rewriting its claims and re-auditing every witness attesting them, because a claim whose witness
kind changes is a claim whose instrument changed.

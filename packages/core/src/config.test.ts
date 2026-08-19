import { assert, expectTypeOf, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import type { Layer } from "effect";

import { configLayer, currentLocalTime } from "#core";
import type { senderAddress, CoreConfig } from "#core";

import { configEnvironmentVariables } from "./config.ts";

const validEnvironment = {
  [configEnvironmentVariables.mailDomain]: "mail.example.com",
  [configEnvironmentVariables.sendHour]: "21",
  [configEnvironmentVariables.timeZone]: "America/New_York",
};

// @attests root/config/is-required-and-valid
it("exposes configured operations through the CoreConfig service", () => {
  expectTypeOf<Effect.Services<typeof currentLocalTime>>().toEqualTypeOf<CoreConfig>();
  expectTypeOf<Effect.Services<ReturnType<typeof senderAddress>>>().toEqualTypeOf<CoreConfig>();
  expectTypeOf<Layer.Success<ReturnType<typeof configLayer>>>().toEqualTypeOf<CoreConfig>();
});

// @attests root/config/is-required-and-valid
it.effect("requires every configuration value without a fallback", () =>
  Effect.gen(function* () {
    for (const missing of Object.values(configEnvironmentVariables)) {
      const environment: Record<string, string | undefined> = { ...validEnvironment };
      delete environment[missing];
      const exit = yield* Effect.exit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
      assert.isTrue(Exit.isFailure(exit), `${missing} was accepted`);
    }
  }),
);

// @attests root/config/is-required-and-valid
it.effect("validates configuration boundaries before use", () =>
  Effect.gen(function* () {
    const invalidEnvironments = [
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "-1" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "24" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "1.5" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "noon" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "" },
      { ...validEnvironment, [configEnvironmentVariables.mailDomain]: "" },
      { ...validEnvironment, [configEnvironmentVariables.timeZone]: "Mars/Olympus" },
    ];

    for (const environment of invalidEnvironments) {
      const exit = yield* Effect.exit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
      assert.isTrue(Exit.isFailure(exit));
    }

    for (const sendHour of ["0", "23"]) {
      const exit = yield* Effect.exit(
        currentLocalTime.pipe(
          Effect.provide(configLayer({ ...validEnvironment, [configEnvironmentVariables.sendHour]: sendHour })),
        ),
      );
      assert.isTrue(Exit.isSuccess(exit), `${sendHour} was refused`);
    }
  }),
);

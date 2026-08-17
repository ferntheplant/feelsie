import { assert, expectTypeOf, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import type { Layer } from "effect";

import { configLayer, currentLocalTime, isSendHour, senderAddress } from "#core";
import type { createPrompt, Database } from "#core";

import { configEnvironmentVariables } from "./config.ts";
import type { CoreConfig } from "./config.ts";

const validEnvironment = {
  [configEnvironmentVariables.mailDomain]: "mail.example.com",
  [configEnvironmentVariables.sendHour]: "21",
  [configEnvironmentVariables.timeZone]: "America/New_York",
};

// @attests core/config/is-context-service
it("exposes configured operations through the CoreConfig service", () => {
  expectTypeOf<Effect.Services<typeof currentLocalTime>>().toEqualTypeOf<CoreConfig>();
  expectTypeOf<Effect.Services<typeof isSendHour>>().toEqualTypeOf<CoreConfig>();
  expectTypeOf<Effect.Services<ReturnType<typeof senderAddress>>>().toEqualTypeOf<CoreConfig>();
  expectTypeOf<Effect.Services<typeof createPrompt>>().toEqualTypeOf<CoreConfig | Database>();
  expectTypeOf<Layer.Success<ReturnType<typeof configLayer>>>().toEqualTypeOf<CoreConfig>();
});

// @attests core/config/is-required
it.effect("requires every configuration value without a fallback", () =>
  Effect.gen(function* () {
    for (const missing of Object.values(configEnvironmentVariables)) {
      const environment: Record<string, string | undefined> = { ...validEnvironment };
      delete environment[missing];
      const localTimeExit = yield* Effect.exit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
      const sendHourExit = yield* Effect.exit(isSendHour.pipe(Effect.provide(configLayer(environment))));
      const senderExit = yield* Effect.exit(senderAddress("checkin").pipe(Effect.provide(configLayer(environment))));
      assert.isTrue(Exit.isFailure(localTimeExit), `${missing} was accepted by currentLocalTime`);
      assert.isTrue(Exit.isFailure(sendHourExit), `${missing} was accepted by isSendHour`);
      assert.isTrue(Exit.isFailure(senderExit), `${missing} was accepted by senderAddress`);
    }
  }),
);

// @attests core/config/is-validated
it.effect("rejects invalid send hours and time zones", () =>
  Effect.gen(function* () {
    const invalidEnvironments = [
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "-1" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "25" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "1.5" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "noon" },
      { ...validEnvironment, [configEnvironmentVariables.sendHour]: "" },
      { ...validEnvironment, [configEnvironmentVariables.timeZone]: "Mars/Olympus" },
    ];

    for (const environment of invalidEnvironments) {
      const exit = yield* Effect.exit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
      assert.isTrue(Exit.isFailure(exit));
    }
  }),
);

import { assert, it } from "@effect/vitest";
import { Effect, Exit } from "effect";

import { configLayer, currentLocalTime, isSendHour, senderAddress } from "#core";

const validEnvironment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};

// @attests core/config/is-required
it.effect("requires every configuration value without a fallback", () =>
  Effect.gen(function* () {
    for (const missing of ["MAIL_DOMAIN", "SEND_HOUR", "TZ"] as const) {
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
      { ...validEnvironment, SEND_HOUR: "-1" },
      { ...validEnvironment, SEND_HOUR: "25" },
      { ...validEnvironment, TZ: "Mars/Olympus" },
    ];

    for (const environment of invalidEnvironments) {
      const exit = yield* Effect.exit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
      assert.isTrue(Exit.isFailure(exit));
    }
  }),
);

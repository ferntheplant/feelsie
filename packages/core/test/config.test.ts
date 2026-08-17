import { Effect, Exit } from "effect";
import { expect, test } from "vite-plus/test";

import { configLayer, currentLocalTime, isSendHour, senderAddress } from "#core";

const validEnvironment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};

// @attests core/config/is-required
test("requires every configuration value without a fallback", async () => {
  for (const missing of ["MAIL_DOMAIN", "SEND_HOUR", "TZ"] as const) {
    const environment: Record<string, string | undefined> = { ...validEnvironment };
    delete environment[missing];
    const localTimeExit = await Effect.runPromiseExit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
    const sendHourExit = await Effect.runPromiseExit(isSendHour.pipe(Effect.provide(configLayer(environment))));
    const senderExit = await Effect.runPromiseExit(
      senderAddress("checkin").pipe(Effect.provide(configLayer(environment))),
    );
    expect(Exit.isFailure(localTimeExit), `${missing} was accepted by currentLocalTime`).toBe(true);
    expect(Exit.isFailure(sendHourExit), `${missing} was accepted by isSendHour`).toBe(true);
    expect(Exit.isFailure(senderExit), `${missing} was accepted by senderAddress`).toBe(true);
  }
});

// @attests core/config/is-validated
test("rejects invalid send hours and time zones", async () => {
  const invalidEnvironments = [
    { ...validEnvironment, SEND_HOUR: "-1" },
    { ...validEnvironment, SEND_HOUR: "25" },
    { ...validEnvironment, TZ: "Mars/Olympus" },
  ];

  for (const environment of invalidEnvironments) {
    const exit = await Effect.runPromiseExit(currentLocalTime.pipe(Effect.provide(configLayer(environment))));
    expect(Exit.isFailure(exit)).toBe(true);
  }
});

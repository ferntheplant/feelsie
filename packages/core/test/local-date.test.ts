import { Effect } from "effect";
import { TestClock } from "effect/testing";
import { expect, test } from "vite-plus/test";

import { configLayer, currentLocalTime } from "#core";

const environment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};

// @attests core/local-date/is-zoned
test("computes local dates and hours in the configured time zone", async () => {
  const utcLocalDateMismatch = Date.parse("2024-01-01T02:00:00Z");
  const instants = [Date.parse("2024-03-10T06:30:00Z"), Date.parse("2024-03-10T07:30:00Z"), utcLocalDateMismatch];

  const program = Effect.gen(function* () {
    const localTimes = [];
    for (const instant of instants) {
      yield* TestClock.setTime(instant);
      localTimes.push(yield* currentLocalTime);
    }
    return localTimes;
  }).pipe(Effect.provide(configLayer(environment)), Effect.provide(TestClock.layer()));

  await expect(Effect.runPromise(program)).resolves.toEqual([
    { date: "2024-03-10", hour: 1 },
    { date: "2024-03-10", hour: 3 },
    { date: "2023-12-31", hour: 21 },
  ]);

  const tokyoProgram = Effect.gen(function* () {
    yield* TestClock.setTime(utcLocalDateMismatch);
    return yield* currentLocalTime;
  }).pipe(Effect.provide(configLayer({ ...environment, TZ: "Asia/Tokyo" })), Effect.provide(TestClock.layer()));
  await expect(Effect.runPromise(tokyoProgram)).resolves.toEqual({ date: "2024-01-01", hour: 11 });
});

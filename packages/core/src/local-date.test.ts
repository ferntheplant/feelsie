import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { TestClock } from "effect/testing";

import { configLayer, currentLocalTime } from "#core";

const environment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};

// @attests core/local-date/is-zoned
it.effect("computes local dates and hours in the configured time zone", () => {
  const utcLocalDateMismatch = Date.parse("2024-01-01T02:00:00Z");
  const instants = [Date.parse("2024-03-10T06:30:00Z"), Date.parse("2024-03-10T07:30:00Z"), utcLocalDateMismatch];

  return Effect.gen(function* () {
    const localTimes = [];
    for (const instant of instants) {
      yield* TestClock.setTime(instant);
      localTimes.push(yield* currentLocalTime);
    }
    assert.deepEqual(localTimes, [
      { date: "2024-03-10", hour: 1 },
      { date: "2024-03-10", hour: 3 },
      { date: "2023-12-31", hour: 21 },
    ]);

    yield* TestClock.setTime(utcLocalDateMismatch);
    const tokyoTime = yield* currentLocalTime.pipe(Effect.provide(configLayer({ ...environment, TZ: "Asia/Tokyo" })));
    assert.deepEqual(tokyoTime, { date: "2024-01-01", hour: 11 });
  }).pipe(Effect.provide(configLayer(environment)));
});

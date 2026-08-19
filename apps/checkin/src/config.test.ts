import { assert, it } from "@effect/vitest";
import { Effect, Exit } from "effect";

import { checkinEnvironmentVariables, decodeCheckinConfig } from "./config.ts";

const environment = {
  [checkinEnvironmentVariables.inboxAddress]: "inbox@example.com",
  [checkinEnvironmentVariables.origin]: "https://checkin.example.com/",
};

it.effect("accepts an HTTPS origin and removes its root slash", () =>
  Effect.gen(function* () {
    const config = yield* decodeCheckinConfig(environment);
    assert.strictEqual(config.origin, "https://checkin.example.com");
  }),
);

it.effect("refuses malformed origins and URLs that contain more than an origin", () =>
  Effect.gen(function* () {
    const invalidOrigins = [
      "https://",
      "http://checkin.example.com",
      "checkin.example.com",
      "ftp://checkin.example.com",
      "https://user:secret@checkin.example.com",
      "https://checkin.example.com/path",
      "https://checkin.example.com?query=yes",
      "https://checkin.example.com#fragment",
    ];

    for (const origin of invalidOrigins) {
      const exit = yield* Effect.exit(
        decodeCheckinConfig({ ...environment, [checkinEnvironmentVariables.origin]: origin }),
      );
      assert.isTrue(Exit.isFailure(exit), `${origin} was accepted`);
    }
  }),
);

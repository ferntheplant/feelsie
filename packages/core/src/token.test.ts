import { assert, it, vi } from "@effect/vitest";
import { Effect } from "effect";

import { configLayer, createPrompt, generateToken } from "#core";

import { withTestDatabase } from "./test-support/sqlite.ts";

const base64UrlPattern = /^[A-Za-z0-9_-]{43}$/;
const environment = {
  MAIL_DOMAIN: "mail.example.com",
  SEND_HOUR: "21",
  TZ: "America/New_York",
};

// @attests core/token/cannot-be-guessed
it.effect("stores token bytes from Web Crypto", () => {
  const getRandomValues = vi
    .spyOn(globalThis.crypto, "getRandomValues")
    .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      if (!(array instanceof Uint8Array)) {
        throw new TypeError("Expected a Uint8Array.");
      }
      array.set(Array.from({ length: 32 }, (_, index) => index));
      return array;
    });
  return withTestDatabase((database) =>
    Effect.gen(function* () {
      const prompt = yield* createPrompt;
      const stored = database.raw.prepare("SELECT token FROM prompts WHERE token = ?").get(prompt.token);
      assert.strictEqual(getRandomValues.mock.calls.length, 1);
      const bytes = getRandomValues.mock.calls[0]?.[0];
      assert.instanceOf(bytes, Uint8Array);
      assert.strictEqual(bytes.byteLength, 32);
      assert.strictEqual(prompt.token, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8");
      assert.deepEqual(stored, { token: prompt.token });
    }).pipe(Effect.provide(configLayer(environment))),
  ).pipe(Effect.ensuring(Effect.sync(() => getRandomValues.mockRestore())));
});

// @attests core/token/cannot-be-guessed
it.effect("generates distinct 32-byte base64url tokens", () =>
  Effect.gen(function* () {
    const tokens = yield* Effect.all(Array.from({ length: 1_000 }, () => generateToken));

    for (const token of tokens) {
      assert.match(token, base64UrlPattern);
      const decoded = Uint8Array.from(atob(token.replaceAll("-", "+").replaceAll("_", "/")), (character) =>
        character.charCodeAt(0),
      );
      assert.strictEqual(decoded.length, 32);
    }

    assert.strictEqual(new Set(tokens).size, 1_000);
  }),
);

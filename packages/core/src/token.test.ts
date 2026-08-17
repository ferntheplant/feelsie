import { assert, it, vi } from "@effect/vitest";
import { Effect } from "effect";

import { generateToken } from "#core";

const base64UrlPattern = /^[A-Za-z0-9_-]{43}$/;

// @attests core/token/uses-web-crypto
it.effect("gets token bytes from Web Crypto", () => {
  const getRandomValues = vi
    .spyOn(globalThis.crypto, "getRandomValues")
    .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      if (!(array instanceof Uint8Array)) {
        throw new TypeError("Expected a Uint8Array.");
      }
      array.set(Array.from({ length: 32 }, (_, index) => index));
      return array;
    });
  return Effect.gen(function* () {
    const token = yield* generateToken;
    assert.strictEqual(getRandomValues.mock.calls.length, 1);
    const bytes = getRandomValues.mock.calls[0]?.[0];
    assert.instanceOf(bytes, Uint8Array);
    assert.strictEqual(bytes.byteLength, 32);
    assert.strictEqual(token, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8");
  }).pipe(Effect.ensuring(Effect.sync(() => getRandomValues.mockRestore())));
});

// @attests core/token/is-32-bytes-base64url
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

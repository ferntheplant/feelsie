import { Effect } from "effect";
import { expect, test, vi } from "vite-plus/test";

import { generateToken } from "#core";

const base64UrlPattern = /^[A-Za-z0-9_-]{43}$/;

// @attests core/token/uses-web-crypto
test("gets token bytes from Web Crypto", () => {
  const getRandomValues = vi
    .spyOn(globalThis.crypto, "getRandomValues")
    .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      if (!(array instanceof Uint8Array)) {
        throw new TypeError("Expected a Uint8Array.");
      }
      array.set(Array.from({ length: 32 }, (_, index) => index));
      return array;
    });
  try {
    const token = Effect.runSync(generateToken);
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(getRandomValues.mock.calls[0]?.[0]).toBeInstanceOf(Uint8Array);
    expect(getRandomValues.mock.calls[0]?.[0].byteLength).toBe(32);
    expect(token).toBe("AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8");
  } finally {
    getRandomValues.mockRestore();
  }
});

// @attests core/token/is-32-bytes-base64url
test("generates distinct 32-byte base64url tokens", () => {
  const tokens = Array.from({ length: 1_000 }, () => Effect.runSync(generateToken));

  for (const token of tokens) {
    expect(token).toMatch(base64UrlPattern);
    const decoded = Uint8Array.from(atob(token.replaceAll("-", "+").replaceAll("_", "/")), (character) =>
      character.charCodeAt(0),
    );
    expect(decoded).toHaveLength(32);
  }

  expect(new Set(tokens)).toHaveLength(1_000);
});

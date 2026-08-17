import { Effect } from "effect";
import { expect, test } from "vite-plus/test";

import { greet } from "./index.ts";

test("greets by name", () => {
  expect(Effect.runSync(greet("world"))).toBe("Hello, world!");
});

import { expect, test } from "vite-plus/test";

import { greet } from "./index.ts";

test("greets by name", () => {
  expect(greet("world")).toBe("Hello, world!");
});

// The D1 resource lives in its own module so both the stack and the Worker can
// `yield*` it. Alchemy memoizes by logical id within a stack, so two yields are
// one database — which is the mechanism `packages/core` will rely on to share
// `Database` between `alchemy.run.ts` and each app's Worker.
import * as Cloudflare from "alchemy/Cloudflare";

// A plain relative string, resolved against the cwd of whoever runs the deploy —
// NOT `new URL("../migrations", import.meta.url)`. This module is bundled into the
// Worker, and `new URL(..., import.meta.url)` is evaluated at cold start inside
// workerd, where it dies with `Invalid URL string`. The provider is the only reader
// of this field and it only ever reads it at plan time, so an inert string is both
// sufficient and the only thing that survives the bundle.
export const Database = Cloudflare.D1.Database("Database", {
  migrationsDir: "./migrations",
});

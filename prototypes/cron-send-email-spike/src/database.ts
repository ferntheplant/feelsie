// A plain relative string, not `new URL("../migrations", import.meta.url)`: this module
// is bundled into the Worker, and `import.meta.url` is evaluated at cold start inside
// workerd, where it dies with `Invalid URL string`.
import * as Cloudflare from "alchemy/Cloudflare";

export const Database = Cloudflare.D1.Database("Database", {
  migrationsDir: "./migrations",
});

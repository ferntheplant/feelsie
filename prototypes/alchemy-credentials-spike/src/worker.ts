// `main: import.meta.url` makes this module its own Worker entrypoint, and the
// bundler reads the module's DEFAULT export as that entrypoint. A Worker declared
// in a module that exports it by name only fails at bundle time, not at type time.
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { Database } from "./database.ts";

export default Cloudflare.Worker(
  "Worker",
  { main: import.meta.url },
  Effect.gen(function* () {
    // ─── init: once per cold start ───
    const database = yield* Database;
    const d1 = yield* Cloudflare.D1.QueryDatabase(database);

    return {
      // ─── runtime: once per request ───
      fetch: Effect.gen(function* () {
        yield* d1.prepare("INSERT OR REPLACE INTO spike (id, note) VALUES (?, ?)").bind("a", "b").run();
        const row = yield* d1.prepare("SELECT note FROM spike WHERE id = ?").bind("a").first<{ note: string }>();
        return HttpServerResponse.text(row?.note ?? "");
      }),
    };
  }).pipe(Effect.provide(Cloudflare.D1.QueryDatabaseBinding)),
);

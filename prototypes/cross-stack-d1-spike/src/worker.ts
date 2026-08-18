// The consuming side, and the whole point of the spike: a Worker in one stack binding a
// database declared by another.
//
// `yield* spikeDatabase` is the cross-stack read, and it happens in the Worker's INIT
// phase — which runs twice with different meanings. Once at plan time on the deploying
// machine, where the ref is resolved against the other stack's deployed state, and once
// per cold start inside workerd, where there is no state store to read at all. Whether
// the second evaluation still produces something `QueryDatabase` can bind is the whole
// question, and only serving a request asks it.
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { spikeDatabase } from "./DataStack.ts";

export default Cloudflare.Worker(
  "Worker",
  { main: import.meta.url },
  Effect.gen(function* () {
    // ─── init: once at plan time, once per cold start ───
    const database = yield* spikeDatabase;
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

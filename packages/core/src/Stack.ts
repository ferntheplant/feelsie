// The typed handle `checkin` and `dashboard` import.
//
// A cross-stack read — `const core = yield* CoreStack` — resolves at plan time against
// the current stage, so a `pr-42` Worker binds a `pr-42` database. The handle carries no
// implementation: it names the stack and the shape of its output, and `alchemy.run.ts`
// is what fills that shape in.
//
// It lives here rather than in `alchemy.run.ts` because a Worker's init phase yields it,
// which means it is bundled into every Worker that binds the database. Nothing in this
// module may run Node-only code at import time.
import { Stack } from "alchemy";
import type * as Cloudflare from "alchemy/Cloudflare";

export interface CoreStackShape {
  readonly database: Cloudflare.D1.Database;
}

export class CoreStack extends Stack<CoreStack, CoreStackShape>()("feelsie-core") {}

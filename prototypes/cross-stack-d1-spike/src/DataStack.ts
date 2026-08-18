// The owning stack's handle, in the shape `packages/core/src/Stack.ts` ended up with:
// scalars in the output shape, and a `Resource.ref` for the thing a Worker binds.
//
// The first version of this file put the D1 resource in the shape, which is what the
// migration document assumed and what `packages/core` shipped. It type-checks. It also
// fails, and the README says how.
import { Stack } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";

const DATA_STACK = "cross-stack-d1-spike-data";

/** What a Worker in another stack binds. */
export const spikeDatabase = Cloudflare.D1.Database.ref("Database", { stack: DATA_STACK });

/** What another stack can read. Scalars only. */
export interface DataStackShape {
  readonly databaseId: string;
  readonly databaseName: string;
}

export class DataStack extends Stack<DataStack, DataStackShape>()(DATA_STACK) {}

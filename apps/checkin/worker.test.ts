// The production path, through the deployed Worker.
//
// Everything in `src/*.test.ts` runs the handlers directly against `node:sqlite` and a
// recording `Mailer`. That is where the adversarial cases live, and it leaves one thing
// unwitnessed: whether the Worker this stack deploys actually hands those handlers the real
// bindings. A005's coverage audit found that gap twice in `core` — a witness that exercises a
// helper in isolation attests the helper — so it is closed here rather than left to be found.
//
// Nothing below talks to Cloudflare. `Test.make({ dev: true })` runs every Worker in workerd
// inside the test process, with D1 and the `send_email` binding emulated locally; the resource
// ids come back `dev:`-prefixed, which the docs offer as the proof no cloud call ran. That is
// what keeps these claims rederivable from a checkout.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import CoreStack from "@feelsie/core/alchemy.run";
import { localState } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Vitest";
import { Effect } from "effect";
import { describe, expect } from "vite-plus/test";

import CheckinStack from "./alchemy.run.ts";
import { checkinEnvironmentVariables } from "./src/config.ts";
import { checkInPath } from "./src/paths.ts";
import { cronExpression } from "./src/worker.ts";

// **`migrationsDir` is relative, and a relative path is resolved against the working directory
// of whoever runs the deploy.** The house rule spells that directory out for a real deploy
// (`vp exec -F @feelsie/core`); a test harness has no `-F`, so this is the same instruction in
// the only form available. Both stacks and `localState()`'s `.alchemy/` then agree on one
// directory, which is what they have to do — see `AGENTS.md`, "The working directory is not
// cosmetic".
const coreDirectory = fileURLToPath(new URL("../../packages/core", import.meta.url));
const originalDirectory = process.cwd();
process.chdir(coreDirectory);

// The Worker reads these as `Config` in its init phase, which at plan time means the deploying
// process's environment — here, this one. `SEND_HOUR` is 0 in `UTC` so that the schedule gate is
// open at whatever o'clock the suite happens to run: the gate's own behaviour is witnessed at
// all twenty-four hours in `src/schedule.test.ts`, and what this file is for is the wiring.
const mailDomain = "mail.emulation.example";
process.env.MAIL_DOMAIN = mailDomain;
process.env.SEND_HOUR = "0";
process.env.TZ = "UTC";
process.env[checkinEnvironmentVariables.inboxAddress] = "inbox@emulation.example";
process.env[checkinEnvironmentVariables.origin] = "https://checkin.emulation.example";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: localState(),
  dev: true,
});

/**
 * Where the local `send_email` simulator persists what it accepted. A file here is the strongest
 * observation of a send this repository can make without an account: the simulator writes it
 * only after validating the sender and recipient allow-lists, exactly as Miniflare does.
 */
const sentMailDirectory = `${coreDirectory}/.alchemy/local/email/text`;

const sentMailFiles = (): ReadonlyArray<string> =>
  existsSync(sentMailDirectory) ? readdirSync(sentMailDirectory).filter((name) => name.endsWith(".txt")) : [];

/**
 * The body of the most recently written message. The simulator's directory outlives a run — it
 * is keyed by nothing but a UUID — so "the newest" is the only way to name this run's message
 * without deleting somebody's evidence from an earlier one.
 */
const latestMailBody = (): string => {
  const newest = [...sentMailFiles()]
    .map((name) => ({ name, at: statSync(`${sentMailDirectory}/${name}`).mtimeMs }))
    .sort((left, right) => right.at - left.at)[0];
  return newest === undefined ? "" : readFileSync(`${sentMailDirectory}/${newest.name}`, "utf8");
};

const fireSchedule = (url: string) =>
  Effect.promise(async () => {
    const response = await fetch(
      `${url}/cdn-cgi/handler/scheduled?cron=${encodeURIComponent(cronExpression)}&format=json`,
    );
    return { status: response.status, body: (await response.json()) as { outcome: string } };
  });

describe("the deployed check-in Worker", () => {
  // Order matters: a cross-stack ref resolves against the upstream stack's persisted outputs,
  // so deploying the Worker before the database is a plan-time failure rather than a race. Torn
  // down in the opposite order, for the reason the stacks are split at all.
  const core = beforeAll(deploy(CoreStack));
  const checkin = beforeAll(deploy(CheckinStack));

  afterAll(destroy(CheckinStack));
  afterAll(destroy(CoreStack));
  afterAll(Effect.sync(() => process.chdir(originalDirectory)));

  test(
    "binds the Core Stack's database rather than one of its own",
    Effect.gen(function* () {
      const { databaseId } = yield* core;
      // `dev:`-prefixed is the proof no cloud call was made, and the ref resolving at all is the
      // proof the cross-stack read works from a real Worker rather than only in a spike.
      expect(databaseId).toMatch(/^dev:/);
      const { worker } = yield* checkin;
      expect(worker.url).toBeDefined();
    }),
  );

  // @attests root/checkin/prompt/reuses-one-prompt-until-success
  // @attests root/checkin/prompt/attempts-start-at-the-send-hour
  // @attests root/checkin/email/sender-follows-the-configured-domain
  test(
    "sends one real message through the send binding, from the configured domain",
    Effect.gen(function* () {
      const { worker } = yield* checkin;
      const url = worker.url ?? "";
      const before = sentMailFiles();

      const fired = yield* fireSchedule(url);
      expect(fired.status).toBe(200);

      const after = sentMailFiles();
      const added = after.filter((name) => !before.includes(name));

      // Counted at the binding, not at the fire. The fire reports `{"outcome":"ok"}` whether or
      // not the send returned — `CronEventSourceLive` swallows the handler's failure — so this
      // file existing is the only thing that distinguishes a send from an invocation.
      //
      // It is also what attests the sender: the binding's `allowedSenderAddresses` is built at
      // plan time from the configured mail domain, and the simulator refuses and writes nothing
      // when the envelope sender is not in it. A `prompt@…` pasted in as a literal while
      // debugging would produce no file here.
      expect(added).toHaveLength(1);
      const body = readFileSync(`${sentMailDirectory}/${added[0] ?? ""}`, "utf8");
      expect(body).toContain(`https://checkin.emulation.example${checkInPath}?token=`);

      // Twenty-three of the day's twenty-four fires do nothing. Firing again writes no second
      // message, on the production path and not only against the stub.
      yield* fireSchedule(url);
      expect(sentMailFiles().filter((name) => !before.includes(name))).toHaveLength(1);
    }),
  );

  // @attests root/checkin/form/get-does-not-write
  // @attests root/checkin/routes/expose-no-history
  test(
    "serves the form on GET and records on POST, and nothing else",
    Effect.gen(function* () {
      const { worker } = yield* checkin;
      const url = worker.url ?? "";

      // The prompt for this local date has already been sent by the test above — that is what
      // `reuses-one-prompt-until-success` means — so the link comes out of the message it produced
      // rather than out of a second one.
      yield* fireSchedule(url);
      const token = /token=([A-Za-z0-9_%-]+)/.exec(latestMailBody())?.[1] ?? "";
      expect(token).not.toBe("");

      const link = `${url}${checkInPath}?token=${token}`;
      const form = yield* Effect.promise(async () => (await fetch(link)).text());
      expect(form).toContain('name="mood"');

      // The GET has now happened twice against a live D1 binding. If it wrote, the confirmation
      // below would not be the first thing to record an entry, and the form above would already
      // have shown one.
      expect(form).toContain("How was it?");

      const recorded = yield* Effect.promise(async () =>
        fetch(`${url}${checkInPath}`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token: decodeURIComponent(token),
            date: new Date().toISOString().slice(0, 10),
            mood: "7",
            energy: "4",
            sleep: "9",
            note: "through the worker",
          }).toString(),
        }),
      );
      expect(recorded.status).toBe(200);

      const answered = yield* Effect.promise(async () => (await fetch(link)).text());
      expect(answered).toContain("You answered already.");
      expect(answered).toContain("through the worker");

      // Every other path is a 404 from the router, before any capability is reached.
      const stray = yield* Effect.promise(async () => fetch(`${url}/history`));
      expect(stray.status).toBe(404);
    }),
  );
});

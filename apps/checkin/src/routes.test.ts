// The route witnesses.
//
// Two of them are types, and both are here rather than in `core` on purpose: the claims are
// about what **this Worker** can reach, and a type assertion written next to the service would
// attest the service.
import { assert, expectTypeOf, it } from "@effect/vitest";
import { LocalDate, Measure, PromptWrite, Timestamp } from "@feelsie/core";
import type {
  CheckIn,
  DatabaseError,
  EntryInput,
  EntryRead,
  EntryReadShape,
  LocalDate as LocalDateType,
  Prompt,
  PromptRead,
} from "@feelsie/core";
import { withTestCapabilities } from "@feelsie/core/test-support";
import type { TestDatabase } from "@feelsie/core/test-support";
import type { Option } from "effect";
import { Effect } from "effect";
import { TestClock } from "effect/testing";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { checkInPath } from "./paths.ts";
import { getForm, postCheckIn, routes } from "./routes.ts";
import { localHour } from "./test-support.ts";

const origin = "https://checkin.example.com";
const today = LocalDate("2024-06-11");
const yesterday = LocalDate("2024-06-10");

const request = (method: string, url: string, body?: Record<string, string>) =>
  Effect.provideService(
    HttpServerRequest.HttpServerRequest,
    HttpServerRequest.fromWeb(
      new Request(url, {
        method,
        ...(body === undefined
          ? {}
          : {
              body: new URLSearchParams(body).toString(),
              headers: { "content-type": "application/x-www-form-urlencoded" },
            }),
      }),
    ),
  );

const bodyOf = (response: HttpServerResponse.HttpServerResponse) =>
  Effect.promise(() => HttpServerResponse.toWeb(response).text());

const sentPrompt = (date: LocalDateType, at: number): Effect.Effect<Prompt, never, PromptWrite> =>
  Effect.gen(function* () {
    const prompts = yield* PromptWrite;
    const prompt = yield* prompts.open(date, Timestamp(at));
    yield* prompts.markSent(date, Timestamp(at));
    return { ...prompt, sentAt: Timestamp(at) };
  }).pipe(Effect.orDie);

const seedEntry = (database: TestDatabase, entry: EntryInput): void => {
  database.raw
    .prepare("INSERT INTO entries (date, mood, energy, sleep, note) VALUES (?, ?, ?, ?, ?)")
    .run(entry.date, entry.mood, entry.energy, entry.sleep, entry.note ?? null);
};

// @attests root/checkin/form/get-does-not-write
it("admits no write operation in the GET handler's requirement channel", () => {
  // The claim closed structurally. Reaching a write from the GET path would put `CheckIn` in
  // this union, and the annotation on `getForm` is where that becomes a compile error — so a
  // violation is unrepresentable rather than caught. `POST` is the only handler that names it.
  expectTypeOf<Effect.Services<typeof getForm>>().toEqualTypeOf<
    EntryRead | HttpServerRequest.HttpServerRequest | PromptRead
  >();
  expectTypeOf<Effect.Services<typeof postCheckIn>>().toEqualTypeOf<CheckIn | HttpServerRequest.HttpServerRequest>();
});

// @attests root/checkin/form/get-does-not-write
it.effect("writes nothing when the prompt link is opened, however many times", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      const prompt = yield* sentPrompt(today, localHour(21));

      for (let visit = 0; visit < 3; visit += 1) {
        const response = yield* getForm.pipe(request("GET", `${origin}${checkInPath}?token=${prompt.token}`));
        assert.strictEqual(response.status, 200);
      }

      // Mail scanners and link-preview tools open the links in your inbox before you do. A GET
      // that wrote would answer some days with whatever the defaults are, and nothing would
      // ever show you that it had.
      assert.deepEqual(database.raw.prepare("SELECT count(*) AS count FROM entries").get(), { count: 0 });
      assert.deepEqual(database.raw.prepare("SELECT answered_at FROM prompts WHERE date = ?").get(today), {
        answered_at: null,
      });
    }),
  ),
);

// @attests root/checkin/form/get-does-not-write
it.effect("records the measures on the production POST path", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      const prompt = yield* sentPrompt(today, localHour(21));

      const response = yield* postCheckIn.pipe(
        request("POST", `${origin}${checkInPath}`, {
          token: prompt.token,
          date: today,
          mood: "8",
          energy: "3",
          sleep: "6",
          note: "long day",
        }),
      );

      // The positive polarity, and it is not optional: a Worker that recorded on **neither**
      // verb passes every prohibition above and violates the claim's second sentence.
      assert.strictEqual(response.status, 200);
      assert.deepEqual(
        database.raw.prepare("SELECT mood, energy, sleep, note FROM entries WHERE date = ?").get(today),
        {
          mood: 8,
          energy: 3,
          sleep: 6,
          note: "long day",
        },
      );
    }),
  ),
);

// @attests root/checkin/routes/expose-no-history
it("exposes no operation returning more than one entry", () => {
  // The entry-reading capability is one operation taking one local date. This is the direct
  // path closed: adding `listEntries` to the service `apps/checkin` holds would break this
  // line, which is what forces A003's list operation onto a service this Worker never receives.
  expectTypeOf<EntryReadShape>().toEqualTypeOf<{
    readonly forDate: (date: LocalDateType) => Effect.Effect<Option.Option<EntryInput>, DatabaseError>;
  }>();
});

// @attests root/checkin/routes/expose-no-history
it("serves exactly the expected route set", () => {
  // Closes the route added later without thinking, which no type and no lint rule sees.
  assert.deepEqual(
    routes.map((route) => `${route.method} ${route.path}`),
    ["GET /check-in", "POST /check-in"],
  );
});

// @attests root/checkin/routes/expose-no-history
it.effect("returns only the entry the presented token authorises", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      const prompt = yield* sentPrompt(today, localHour(21));
      yield* sentPrompt(yesterday, localHour(21) - 24 * 60 * 60 * 1_000);

      seedEntry(database, {
        date: today,
        mood: Measure(5),
        energy: Measure(5),
        sleep: Measure(5),
        note: "today-only-marker",
      });
      seedEntry(database, {
        date: yesterday,
        mood: Measure(1),
        energy: Measure(1),
        sleep: Measure(1),
        note: "yesterday-only-marker",
      });

      const page = yield* getForm.pipe(
        request("GET", `${origin}${checkInPath}?token=${prompt.token}`),
        Effect.flatMap(bodyOf),
      );

      // This is the failure none of the other witnesses see: a route that called the
      // single-entry read in a loop would defeat the type witness while importing nothing new.
      assert.include(page, "today-only-marker");
      assert.notInclude(page, "yesterday-only-marker");
      assert.include(page, today);
      assert.notInclude(page, yesterday);
    }),
  ),
);

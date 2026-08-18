// The route witnesses.
//
// Two of them are types, and both are here rather than in `core` on purpose: the claims are
// about what **this Worker** can reach, and a type assertion written next to the service would
// attest the service.
import { assert, expectTypeOf, it } from "@effect/vitest";
import { CheckIn, DatabaseError, LocalDate, Measure, PromptWrite, Timestamp } from "@feelsie/core";
import type {
  CheckInFormData,
  CheckInFormRead,
  CheckInFormReadShape,
  EntryInput,
  LocalDate as LocalDateType,
  Prompt,
  Token as TokenType,
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
const validSubmission = {
  token: "test-token",
  date: today,
  mood: "8",
  energy: "3",
  sleep: "6",
  note: "long day",
};

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
    CheckInFormRead | HttpServerRequest.HttpServerRequest
  >();
  expectTypeOf<Effect.Services<typeof postCheckIn>>().toEqualTypeOf<CheckIn | HttpServerRequest.HttpServerRequest>();
});

// @attests root/checkin/form/get-does-not-write
it.effect("writes nothing when the prompt link is opened, however many times", () =>
  withTestCapabilities((database) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(localHour(21));
      const prompt = yield* sentPrompt(today, localHour(21));
      const changesBeforeGet = database.raw.prepare("SELECT total_changes() AS count").get();

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
      // This reaches every table, including tables that a later migration adds. Named read
      // capabilities cannot prove that their implementations stay read-only.
      assert.deepEqual(database.raw.prepare("SELECT total_changes() AS count").get(), changesBeforeGet);
    }),
  ),
);
// @attests:end

it.effect("returns unavailable for a database failure", () =>
  Effect.gen(function* () {
    let attempts = 0;
    const response = yield* postCheckIn.pipe(
      request("POST", `${origin}${checkInPath}`, validSubmission),
      Effect.provideService(CheckIn, {
        answer: () =>
          Effect.suspend(() => {
            attempts += 1;
            return Effect.fail(new DatabaseError({ cause: "transient", operation: "test write" }));
          }),
      }),
    );

    assert.strictEqual(response.status, 503);
    assert.strictEqual(attempts, 1);
  }),
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

// @attests root/prompt/expires-after-seven-days
it.effect("serves the form before expiry and refuses it at the expiry instant", () =>
  withTestCapabilities(() =>
    Effect.gen(function* () {
      const sentAt = localHour(21);
      const sevenDays = 7 * 24 * 60 * 60 * 1_000;
      const prompt = yield* sentPrompt(today, sentAt);
      const link = `${origin}${checkInPath}?token=${prompt.token}`;

      yield* TestClock.setTime(sentAt + sevenDays - 1);
      const before = yield* getForm.pipe(request("GET", link));
      yield* TestClock.setTime(sentAt + sevenDays);
      const atExpiry = yield* getForm.pipe(request("GET", link));

      assert.strictEqual(before.status, 200);
      assert.strictEqual(atExpiry.status, 410);
    }),
  ),
);

// @attests root/checkin/routes/expose-no-history
it("exposes no operation returning more than one entry", () => {
  // The entry-reading capability takes a token, not a date. Adding a date read or `listEntries`
  // to the service this Worker holds breaks this line.
  expectTypeOf<CheckInFormReadShape>().toEqualTypeOf<{
    readonly forToken: (token: TokenType) => Effect.Effect<Option.Option<CheckInFormData>, DatabaseError>;
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

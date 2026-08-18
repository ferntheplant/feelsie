// Every route this Worker serves, as data.
//
// Two claims are about this table rather than about any handler in it.
//
// **`root/checkin/form/get-does-not-write`.** The GET handler is annotated
// `Effect<…, …, EntryRead | HttpServerRequest | PromptRead>` and the POST handler is the only
// one that names `CheckIn`. The annotations are the witness: reaching a write from the GET path
// would add `CheckIn` to its requirement channel, and the annotation is where that becomes a
// compile error. `core` had to change for this to be possible at all — narrowing a SQL-taking
// handle does not make a write unrepresentable, because `first` runs `INSERT … RETURNING` and
// returns its row. See `packages/core/src/capabilities.ts`.
//
// **`root/checkin/routes/expose-no-history`.** The set below is the whole answer to "what can
// this Worker return", and it is a value a test can read. The other half — that the route
// returning an entry returns only the one its token authorises — is a property of `getForm`,
// because the type witness cannot see a handler that calls a single-entry read in a loop.

import { CheckIn, EntryRead, expiresAt, LocalDate, Measure, PromptRead, Token } from "@feelsie/core";
import type { EntryInput } from "@feelsie/core";
import { Clock, Effect, Option, Schema } from "effect";
import type { HttpMethod } from "effect/unstable/http/HttpMethod";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { checkInForm, recordedPage, unusableTokenPage } from "./form.ts";
import { checkInPath } from "./paths.ts";

/**
 * A route's handler, at the widest requirement any of them has. Each handler is annotated
 * narrowly at its own definition, and assigning a narrower one here does not widen it — this
 * type describes what the Worker must provide, not what any one handler may reach.
 */
export type RouteHandler = Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  never,
  CheckIn | EntryRead | HttpServerRequest.HttpServerRequest | PromptRead
>;

export interface Route {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: RouteHandler;
}

const measureFromForm = Schema.NumberFromString.pipe(
  Schema.decodeTo(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 10 }))),
);

const CheckInSubmission = Schema.Struct({
  token: Schema.NonEmptyString,
  date: Schema.NonEmptyString,
  mood: measureFromForm,
  energy: measureFromForm,
  sleep: measureFromForm,
  note: Schema.optionalKey(Schema.String),
});

const tokenFromQuery: Effect.Effect<Option.Option<Token>, never, HttpServerRequest.HttpServerRequest> = Effect.map(
  HttpServerRequest.HttpServerRequest,
  (request) =>
    Option.map(HttpServerRequest.toURL(request), (url) => url.searchParams.get("token")).pipe(
      Option.filter((value): value is string => value !== null && value.length > 0),
      Option.map(Token),
    ),
);

/**
 * The check-in form for a presented token.
 *
 * **This handler cannot write, and that is a property of the line below rather than of the body
 * above it.** Its requirement channel names two read capabilities and nothing else; adding a
 * write would be a type error here, not a failing test — which matters because the failure this
 * prevents is invisible. Mail scanners and link-preview tools open the links in your inbox
 * before you do, so a GET that wrote would answer some days for you, with whatever the defaults
 * are, and you would never see it happen.
 */
export const getForm: Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  never,
  EntryRead | HttpServerRequest.HttpServerRequest | PromptRead
> = Effect.gen(function* () {
  const prompts = yield* PromptRead;
  const entries = yield* EntryRead;
  const presented = yield* tokenFromQuery;

  if (Option.isNone(presented)) {
    return HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(400));
  }

  const found = yield* prompts.forToken(presented.value);
  if (Option.isNone(found)) {
    return HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(404));
  }

  const prompt = found.value;
  const expiry = expiresAt(prompt);
  const now = yield* Clock.currentTimeMillis;

  // An unsent prompt has no expiry, and its token never left the building. Both refusals land
  // on the same page for the same reason: this hostname is open to the internet.
  if (Option.isNone(expiry) || now >= expiry.value) {
    return HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(410));
  }

  // The one entry the token authorises, read by the prompt's own date. Nothing here takes a
  // date from the request, so there is no parameter to widen into somebody else's day.
  const existing = yield* entries.forDate(prompt.date);
  return HttpServerResponse.html(checkInForm(prompt.token, prompt.date, existing));
}).pipe(Effect.orDie);

/**
 * Records the measures. The only handler that names `CheckIn`, which is the only capability
 * that can write.
 */
export const postCheckIn: Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  never,
  CheckIn | HttpServerRequest.HttpServerRequest
> = Effect.gen(function* () {
  const checkIn = yield* CheckIn;
  const submission = yield* HttpServerRequest.schemaBodyUrlParams(CheckInSubmission).pipe(Effect.option);

  if (Option.isNone(submission)) {
    return HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(400));
  }

  const { date, energy, mood, note, sleep, token } = submission.value;
  const entry: EntryInput = {
    date: LocalDate(date),
    mood: Measure(mood),
    energy: Measure(energy),
    sleep: Measure(sleep),
    ...(note !== undefined && note !== "" ? { note } : {}),
  };

  const recorded = yield* checkIn.answer(Token(token), entry).pipe(Effect.option);
  return Option.isNone(recorded)
    ? HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(410))
    : HttpServerResponse.html(recordedPage(date));
}).pipe(Effect.orDie);

/**
 * The route set. Two entries, one path, two verbs — and the pair is the point: a Worker that
 * recorded on neither verb would satisfy both halves of `get-does-not-write`'s prohibition and
 * be useless.
 */
export const routes: ReadonlyArray<Route> = [
  { method: "GET", path: checkInPath, handler: getForm },
  { method: "POST", path: checkInPath, handler: postCheckIn },
];

/**
 * Dispatch, closed over the table above. A request that matches no entry gets 404 without
 * reaching any capability at all.
 */
export const router: RouteHandler = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const path = Option.match(HttpServerRequest.toURL(request), {
    onNone: () => request.url,
    onSome: (url) => url.pathname,
  });

  const route = routes.find((candidate) => candidate.method === request.method && candidate.path === path);
  return route === undefined
    ? HttpServerResponse.html(unusableTokenPage()).pipe(HttpServerResponse.setStatus(404))
    : yield* route.handler;
});

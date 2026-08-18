// The two configured values this Worker needs that `core` does not: where the daily mail goes,
// and where the link in it points. Both are addresses of one kind or another, which is why
// neither is written anywhere as a literal — see `root/checkin/email/sender-follows-the-configured-domain`.
//
// `core`'s three values (mail domain, send hour, time zone) keep their own decoder and their
// own claim. This one is deliberately separate rather than folded in: widening
// `root/config/is-required-and-valid` to cover an app's configuration would make an affirmed
// claim about `core` depend on what an app happens to need this week.

import { configEnvironmentVariables } from "@feelsie/core";
import { Config, Context, Effect, Schema } from "effect";

import { CheckinConfigError } from "./errors.ts";

export const checkinEnvironmentVariables = {
  inboxAddress: "INBOX_ADDRESS",
  origin: "CHECKIN_ORIGIN",
} as const;

export interface CheckinConfigValue {
  /** Where the daily prompt is sent. Also the address the send binding is pinned to. */
  readonly inboxAddress: string;
  /** The origin the prompt link is built from, with no trailing slash. */
  readonly origin: string;
}

export class CheckinConfig extends Context.Service<CheckinConfig, CheckinConfigValue>()(
  "@feelsie/checkin/CheckinConfig",
) {}

const CheckinOrigin = Schema.URLFromString.pipe(
  Schema.refine(
    (url): url is URL =>
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "",
    { expected: "an HTTPS origin without credentials, a path, a query, or a fragment" },
  ),
);

const requiredValue = (
  environment: Record<string, string | undefined>,
  field: string,
): Effect.Effect<string, CheckinConfigError> => {
  const value = environment[field];
  return value === undefined || value.trim() === ""
    ? Effect.fail(new CheckinConfigError({ field, value: value ?? "" }))
    : Effect.succeed(value);
};

export const decodeCheckinConfig = (
  environment: Record<string, string | undefined>,
): Effect.Effect<CheckinConfigValue, CheckinConfigError> =>
  Effect.gen(function* () {
    const inboxAddress = yield* requiredValue(environment, checkinEnvironmentVariables.inboxAddress);
    const originValue = yield* requiredValue(environment, checkinEnvironmentVariables.origin);

    if (!inboxAddress.includes("@")) {
      return yield* new CheckinConfigError({ field: checkinEnvironmentVariables.inboxAddress, value: inboxAddress });
    }

    const origin = yield* Schema.decodeUnknownEffect(CheckinOrigin)(originValue).pipe(
      Effect.mapError(() => new CheckinConfigError({ field: checkinEnvironmentVariables.origin, value: originValue })),
    );

    return { inboxAddress, origin: origin.origin };
  });

/**
 * Every configured value the Worker needs, read as `Config` in the init phase.
 *
 * `Config` rather than `WorkerEnvironment` because only `Config` registers the binding: at plan
 * time Alchemy intercepts each read, takes the value from the deploying machine's environment,
 * and binds it on the Worker; at cold start the same read comes back off `env`. Reading `env`
 * directly would work at runtime and silently bind nothing at deploy.
 *
 * The values are handed back as a plain record so that `core`'s own decoder — the one
 * `root/config/is-required-and-valid` is about — is still what validates them.
 */
export const readEnvironment: Effect.Effect<Record<string, string | undefined>> = Effect.gen(function* () {
  const names: ReadonlyArray<string> = [
    ...Object.values(configEnvironmentVariables),
    ...Object.values(checkinEnvironmentVariables),
  ];
  const entries = yield* Effect.all(
    names.map((name) => Effect.map(Config.string(name), (value) => [name, value] as const)),
  );
  return Object.fromEntries(entries);
}).pipe(Effect.orDie);

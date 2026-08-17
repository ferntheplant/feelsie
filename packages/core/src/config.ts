import { Config, ConfigProvider, Context, DateTime, Effect, Layer } from "effect";

import { ConfigValidationError } from "./errors.ts";
import { makeCoreConfigValue, type CoreConfigValue } from "./model.ts";

export const configEnvironmentVariables = {
  mailDomain: "MAIL_DOMAIN",
  sendHour: "SEND_HOUR",
  timeZone: "TZ",
} as const;

const rawConfig = Config.unwrap({
  mailDomain: Config.nonEmptyString(configEnvironmentVariables.mailDomain),
  sendHour: Config.int(configEnvironmentVariables.sendHour),
  timeZone: Config.string(configEnvironmentVariables.timeZone),
});

export class CoreConfig extends Context.Service<CoreConfig, CoreConfigValue>()("@feelsie/core/CoreConfig") {}

export const decodeConfig = (environment: Record<string, string | undefined>) =>
  Effect.gen(function* () {
    const raw = yield* rawConfig.parse(ConfigProvider.fromEnvRecord(environment));

    if (raw.sendHour < 0 || raw.sendHour > 23) {
      return yield* new ConfigValidationError({
        field: configEnvironmentVariables.sendHour,
        value: String(raw.sendHour),
      });
    }

    yield* DateTime.zoneMakeNamedEffect(raw.timeZone).pipe(
      Effect.mapError(
        () =>
          new ConfigValidationError({
            field: configEnvironmentVariables.timeZone,
            value: raw.timeZone,
          }),
      ),
    );

    return makeCoreConfigValue(raw);
  });

export const configLayer = (environment: Record<string, string | undefined>) =>
  Layer.effect(CoreConfig, decodeConfig(environment));

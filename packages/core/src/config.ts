import { Config, ConfigProvider, Context, DateTime, Effect, Layer } from "effect";

import { ConfigValidationError } from "./errors.ts";
import { makeCoreConfigValue, type CoreConfigValue } from "./model.ts";

const rawConfig = Config.unwrap({
  mailDomain: Config.nonEmptyString("MAIL_DOMAIN"),
  sendHour: Config.int("SEND_HOUR"),
  timeZone: Config.string("TZ"),
});

export class CoreConfig extends Context.Service<CoreConfig, CoreConfigValue>()("@feelsie/core/CoreConfig") {}

export const decodeConfig = (environment: Record<string, string | undefined>) =>
  Effect.gen(function* () {
    const raw = yield* rawConfig.parse(ConfigProvider.fromEnvRecord(environment));

    if (raw.sendHour < 0 || raw.sendHour > 23) {
      return yield* new ConfigValidationError({
        field: "SEND_HOUR",
        value: String(raw.sendHour),
      });
    }

    yield* DateTime.zoneMakeNamedEffect(raw.timeZone).pipe(
      Effect.mapError(
        () =>
          new ConfigValidationError({
            field: "TZ",
            value: raw.timeZone,
          }),
      ),
    );

    return makeCoreConfigValue(raw);
  });

export const configLayer = (environment: Record<string, string | undefined>) =>
  Layer.effect(CoreConfig, decodeConfig(environment));

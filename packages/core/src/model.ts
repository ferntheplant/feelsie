import { Brand } from "effect";

const ValidatedConfig = Symbol("@feelsie/core/ValidatedConfig");

export type LocalDate = Brand.Branded<string, "LocalDate">;
export const LocalDate: Brand.Constructor<LocalDate> = Brand.nominal<LocalDate>();

export type Measure = Brand.Branded<number, "Measure">;
export const Measure: Brand.Constructor<Measure> = Brand.nominal<Measure>();

export type Timestamp = Brand.Branded<number, "Timestamp">;
export const Timestamp: Brand.Constructor<Timestamp> = Brand.nominal<Timestamp>();

export type Token = Brand.Branded<string, "Token">;
export const Token: Brand.Constructor<Token> = Brand.nominal<Token>();

export interface CoreConfigValue {
  readonly [ValidatedConfig]: true;
  readonly timeZone: string;
  readonly sendHour: number;
  readonly mailDomain: string;
}

export const makeCoreConfigValue = (value: Omit<CoreConfigValue, typeof ValidatedConfig>): CoreConfigValue => ({
  ...value,
  [ValidatedConfig]: true,
});

export interface LocalTime {
  readonly date: LocalDate;
  readonly hour: number;
}

export interface Prompt {
  readonly date: LocalDate;
  readonly token: Token;
  readonly createdAt: Timestamp;
  /** Absent until a send returns. An unsent prompt authorises nothing: its token never left. */
  readonly sentAt?: Timestamp;
  readonly answeredAt?: Timestamp;
}

export interface EntryInput {
  readonly date: LocalDate;
  readonly mood: Measure;
  readonly energy: Measure;
  readonly sleep: Measure;
  readonly note?: string;
}

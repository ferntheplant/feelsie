const ValidatedConfig = Symbol("@feelsie/core/ValidatedConfig");

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
  readonly date: string;
  readonly hour: number;
}

export interface Prompt {
  readonly date: string;
  readonly token: string;
  readonly sentAt: number;
  readonly expiresAt: number;
  readonly answeredAt?: number;
}

export interface EntryInput {
  readonly date: string;
  readonly mood: number;
  readonly energy: number;
  readonly sleep: number;
  readonly note?: string;
}

export interface Entry extends EntryInput {}

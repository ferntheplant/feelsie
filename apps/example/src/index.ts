import { Effect } from "effect";

export const greet = (name: string): Effect.Effect<string> => {
  return Effect.succeed(`Hello, ${name}!`);
};

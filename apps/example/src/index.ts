/**
 * Placeholder module. `vp run ready` fans out to every workspace package's `test` and `build`
 * scripts, and a workspace with no packages has neither task to plan — so the gate fails on an
 * empty repo. This package is what makes the gate meaningful on day one; rename it to the
 * first real module and this file goes away.
 */
export const greet = (name: string): string => `Hello, ${name}!`;

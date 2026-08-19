/**
 * The one path this Worker serves, in one place. It is its own module because `routes.ts`,
 * `form.ts`, and `message.ts` all need it, and the form's action and the mailed link have to be
 * the same string as the route or the daily mail leads to a 404.
 */
export const checkInPath = "/check-in";

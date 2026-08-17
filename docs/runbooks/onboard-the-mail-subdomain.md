# Runbook — onboard the mail subdomain

One-time. A human does this in the Cloudflare dashboard; no code performs it.

**Do this first on a domain you do not use for email.** Onboarding is the single most dangerous
step in the project, and the practice run costs an afternoon.

## Why this is dangerous

Email Routing takes control of a domain's MX records. If you onboard the apex domain and your
personal email lives there, your personal email stops — and it stops quietly, because nothing
bounces to you.

So: onboard a subdomain, never the apex. `mail.<domain>`.

## Procedure

1. Run `dig MX <domain>` and **keep the output**. This is the only record of what the zone
   looked like before you touched it.
2. Open the Cloudflare dashboard. Go to **Compute → Email Service**.
3. Onboard `mail.<domain>` for **Email Sending**. Not the apex.
4. Add your personal address as a destination address.
5. Open the verification email Cloudflare sends, and verify the address.
6. Run `dig MX <domain>` again. Compare it against step 1. The apex MX records must be
   unchanged.
7. Send yourself three test messages. Check the spam folder for all three, not just the first.

## Also set up, and also uncheckable

These are Cloudflare-dashboard settings with no representation in this repository. They are
listed here because the runbook is the only place that can hold them.

- **An Access application on the whole dashboard hostname**, with a one-time PIN policy and a
  30-day session. On the hostname, never on a path.
- **No Access application on the check-in hostname.** Protecting it by accident breaks every
  prompt link already sitting in your inbox, and it breaks them silently, because the mail still
  arrives.
- **A rate-limit rule on the check-in hostname**, at 30 requests per minute.

After any change to Access or to DNS, re-run the checks below by hand.

## Checks, and why none of them is a claim

| Check                                    | Command                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| the apex MX records are unchanged        | `dig MX <domain>`, compared against step 1                                                                 |
| the dashboard is protected on every path | request `/`, a deep path, and a path that does not exist — all three must redirect to the Access challenge |
| the check-in hostname is open            | request a prompt link with no session; it must serve the form                                              |
| the rate limit is in place               | read the rule back in the dashboard                                                                        |

Every one of these was drafted as a claim and deleted. **A claim's state must be rederivable
from the repository alone, and none of these is.** A witness for them would either carry its
verdict green forever — no pull request touches a Cloudflare setting, so nothing ever voids it —
or sit silent on every canvass and train you to ignore a permanent yellow row.

The risk is real and it is the largest in the project. It is simply not a risk a pull request
can catch, and pretending otherwise would have been worse than admitting it. See
[`.scratch/CRUX-FEEDBACK.md`](../../.scratch/CRUX-FEEDBACK.md) for the full argument.

The third row is the one to be most careful about. A wrong path rule on the dashboard is what
[`two-hostnames.md`](../rationale/two-hostnames.md) exists to prevent, and a request for a path
nobody thought of is the only thing that finds it.

Keep the step 1 output somewhere durable. Without it the first check can only say "here are some
MX records" rather than "they did not change".

<!-- @grounds checkin/exposes-no-history -->

# The check-in form and the dashboard are on separate hostnames

`checkin.<domain>` serves the form and carries no Access application. `mood.<domain>` serves the
dashboard and carries an Access application on the whole hostname.

The rejected option was one hostname with two paths, and an Access application scoped to the
dashboard path. Cloudflare Access can do this, and it is one fewer DNS record and one fewer
Worker route.

It was rejected on the shape of its failure. A path rule is a rule, so it can be written wrong,
and the wrong version of it does not announce itself — the dashboard simply answers everyone.
A hostname boundary has no rule to get wrong: the application either covers the hostname or it
does not, and there is no third state where it covers most of it.

The asymmetry is what makes this worth paying for. Getting the path rule right buys nothing you
can feel. Getting it wrong publishes every entry you have ever written.

The cost is nearly nil here, because the design already needs two Workers for an unrelated
reason (see [`two-workers.md`](./two-workers.md)). Two Workers on two hostnames is not more work
than two Workers on one.

## Consequences

The check-in hostname is deliberately open to the internet, which is why the token rules in
[`the-token-is-random.md`](./the-token-is-random.md) have to carry real weight on their own, and
why the check-in Worker claims that it serves no route returning anything but the entry a
presented token authorises.

Neither half of the Access arrangement is itself a claim. Whether an application covers the
dashboard hostname, and whether one has been added to the check-in hostname by mistake, are
facts about a Cloudflare account and no checkout can answer them. They are verified in
[the runbook](../runbooks/onboard-the-mail-subdomain.md) and watched by monitoring. What this
document buys is that the _failure_ is a missing application rather than a mis-scoped path rule
— a state a person can check in one glance instead of by reasoning about precedence.

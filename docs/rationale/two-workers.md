# The check-in Worker and the dashboard Worker are separate

Two Workers on one D1 database. The check-in Worker holds the `scheduled` handler, the
`send_email` binding, and the form. The dashboard Worker is SvelteKit and does nothing else.

The rejected option was one Worker serving both. It is one deployment, one set of bindings, and
one place to look.

The immediate reason is mechanical: a SvelteKit Worker does not comfortably hold a `scheduled`
handler, so combining them means fighting the adapter for as long as the project exists.

The better reason is that the two halves want opposite things. The check-in Worker must be
reachable by anyone holding a link, because that link arrives by email and is opened by a phone
with no session. The dashboard must be reachable by nobody but you. Those are not two
configurations of one service; they are two services, and the split lets each one be simple
instead of conditional.

This is a decision nothing can violate, so it leaves no claim behind — a single Worker is not
something an implementation can drift into by accident. What it leaves behind is
[`two-hostnames.md`](./two-hostnames.md), which spends the boundary this creates, and the
dashboard's read-only database handle, which is the part that is genuinely violable and is
therefore claimed.

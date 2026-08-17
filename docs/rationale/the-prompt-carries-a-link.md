# The prompt carries a link, and you do not reply to it

The daily email holds a link to a form. You open it and you set three sliders.

The rejected option was reply-by-email. The email asked three questions, you replied with three
numbers, and a Cloudflare email handler read the reply and recorded the values. It is a nicer
interaction — the reply button is already under your thumb — and it was dropped anyway, because
of what it drags in:

- a MIME parser
- code to strip the quoted original from the reply
- code to strip your signature
- a token in the subject line, because the reply is the only thing that says which date it
  answers
- a confirmation email, because every one of the above fails **silently**

The last one decides it. A parse failure in a reply produces no error anywhere you would look;
you would find out weeks later that a month of data is missing. The link method has no parse
step, so it has no silent failure, so it needs no confirmation channel to compensate.

The cost is one browser tab instead of a reply. That is the whole cost.

Reply-by-email stays possible as a later addition, on top of a working system rather than
underneath one.

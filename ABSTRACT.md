# Feelsie

Status: draft. The core package is built. The Workers are not built yet.
Written in ASD-STE100 Simplified Technical English.

---

## 1. Purpose

The system sends you one email each day.
The email has a link.
The link opens a short form.
The form records three measures: mood, energy, and sleep.
Each measure is a number from 1 to 10.

A private web page shows the history and the summary statistics.
The statistics include trend lines and weekly averages.

---

## 2. Components

All parts run on Cloudflare.
You do not need the Mac mini for this system.

| Component        | Product                       | Function                                                    |
| ---------------- | ----------------------------- | ----------------------------------------------------------- |
| Check-in Worker  | Cloudflare Workers            | Sends the daily email. Shows the form. Records the answers. |
| Dashboard Worker | Cloudflare Workers, SvelteKit | Shows the history and the statistics.                       |
| Database         | Cloudflare D1                 | Keeps the prompts and the entries.                          |
| Email            | Cloudflare Email Service      | Sends the daily email.                                      |
| Access control   | Cloudflare Access             | Protects the dashboard with a one-time PIN.                 |
| Backup           | Cloudflare R2                 | Keeps a copy of the database.                               |

There are two Workers and two hostnames.
Both Workers use the same D1 database.
[`docs/rationale/two-workers.md`](./docs/rationale/two-workers.md) and
[`docs/rationale/two-hostnames.md`](./docs/rationale/two-hostnames.md) say why.

---

## 3. Data flow

1. The cron trigger starts the check-in Worker.
2. The Worker makes a random token.
3. The Worker writes the token to the database.
4. The Worker sends an email to you. The email has a link. The link contains the token.
5. You open the email. You touch the link.
6. The Worker reads the token. The Worker shows the form.
7. You set the three measures. You send the form.
8. The Worker writes the measures to the database.
9. You open the dashboard when you want to see the history.

---

## 4. Where the rest of this document went

This file used to hold six different kinds of writing. Each kind now has one home, and nothing
lives in two of them.

| If you need                        | Read                                             |
| ---------------------------------- | ------------------------------------------------ |
| What a word means                  | [`GLOSSARY.md`](./GLOSSARY.md)                   |
| What the system promises now       | [`docs/catalog/`](./docs/catalog/)               |
| Why a promise reads as it does     | [`docs/rationale/`](./docs/rationale/)           |
| Why something broken is not broken | [`docs/gotchas.md`](./docs/gotchas.md)           |
| How to perform a one-time setup    | [`docs/runbooks/`](./docs/runbooks/)             |
| What is not decided yet            | [`.scratch/fog.md`](./.scratch/fog.md)           |
| What gets built, and in what order | [`.scratch/amendments/`](./.scratch/amendments/) |

The catalog contains the core claims. The remaining promises are proposals in `.scratch/`.

---

## Appendix A — Language note

This document uses ASD-STE100 Simplified Technical English rules:
short sentences, active voice, simple verb tenses, and one instruction for each sentence.
Full compliance needs a check against the approved word list in the specification.
Product names, `code identifiers`, and Cloudflare terms are technical names and stay unchanged.

The rest of the repository does not follow these rules.
Simplified Technical English is for procedures and descriptions.
A rationale argues, and an argument needs subordinate clauses.

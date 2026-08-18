// The three sliders, the note, and the two pages either side of them. No styling worth the
// name: this page is opened from a link in your own inbox, once a day, on a phone.

import type { EntryInput, Token } from "@feelsie/core";
import { Option } from "effect";

import { checkInPath } from "./paths.ts";

const escape = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const page = (title: string, body: string): string =>
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0 auto; max-width: 32rem; padding: 2rem 1rem; }
  label { display: block; margin: 1.5rem 0 0.25rem; font-weight: 600; }
  input[type="range"], textarea { width: 100%; }
  output { font-variant-numeric: tabular-nums; }
  button { font: inherit; margin-top: 1.5rem; padding: 0.6rem 1.2rem; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

const slider = (name: string, label: string, value: number): string =>
  `<label for="${name}">${escape(label)} <output for="${name}">${value}</output></label>
<input type="range" id="${name}" name="${name}" min="1" max="10" step="1" value="${value}"
  oninput="this.previousElementSibling.querySelector('output').textContent = this.value">`;

/**
 * The check-in form for a token that authorises today. Rendering the entry that already exists
 * is what makes a second visit useful — `root/entry/last-write-wins` means answering again
 * replaces the first answer, and a form that forgot what you said would make that a trap.
 */
export const checkInForm = (token: Token, date: string, existing: Option.Option<EntryInput>): string => {
  const entry = Option.getOrUndefined(existing);
  return page(
    "Feelsie",
    `<h1>${escape(date)}</h1>
<p>${entry === undefined ? "How was it?" : "You answered already. Answering again replaces it."}</p>
<form method="post" action="${checkInPath}">
<input type="hidden" name="token" value="${escape(token)}">
<input type="hidden" name="date" value="${escape(date)}">
${slider("mood", "Mood", entry?.mood ?? 5)}
${slider("energy", "Energy", entry?.energy ?? 5)}
${slider("sleep", "Sleep", entry?.sleep ?? 5)}
<label for="note">Anything worth remembering?</label>
<textarea id="note" name="note" rows="4">${escape(entry?.note ?? "")}</textarea>
<button type="submit">Record it</button>
</form>`,
  );
};

export const recordedPage = (date: string): string =>
  page("Feelsie", `<h1>${escape(date)}</h1><p>Recorded. See you tomorrow.</p>`);

/**
 * What an unusable token gets. Deliberately the same page for "never existed", "never sent",
 * and "expired": the check-in hostname carries no Access application
 * (`docs/rationale/two-hostnames.md`), so the only thing standing between the internet and
 * your history is the token, and a page that distinguished those three would answer questions
 * for whoever was guessing.
 */
export const unusableTokenPage = (): string =>
  page("Feelsie", "<h1>That link is no longer good</h1><p>Wait for tomorrow's email.</p>");

-- A prompt is created and sent in two steps, because A002 promises that a prompt marked sent
-- is one whose send returned. `0001_core.sql` could not express that: `sent_at` was NOT NULL,
-- so the row could only be written after a successful send — and writing it after the send is
-- the one ordering that can send twice for a local date (send returns, insert fails, the next
-- fire sends again).
--
-- `expires_at` is gone rather than made nullable. It was always `sent_at + seven days`, and a
-- stored copy of a derived value is a second thing to keep true; expiry is computed in
-- `core.ts` now. Nothing read it as an independent value.
--
-- SQLite cannot drop a NOT NULL or a CHECK in place, so this is the twelve-step table rebuild
-- in its short form. The copy carries `sent_at` into both `created_at` and `sent_at`: every row
-- written under `0001_core.sql` was created and sent in one statement.
ALTER TABLE prompts RENAME TO prompts_0001;

CREATE TABLE prompts (
  date TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  -- NULL until a send returns. `answered_at` is NULL until the prompt is answered, and an
  -- unsent prompt can never be answered, so this pair is ordered rather than independent.
  sent_at INTEGER,
  answered_at INTEGER
) STRICT;

INSERT INTO prompts (date, token, created_at, sent_at, answered_at)
SELECT date, token, sent_at, sent_at, answered_at FROM prompts_0001;

DROP TABLE prompts_0001;

-- One row per send that did not return. The scheduled handler is the only writer, and it
-- writes here because Alchemy's cron event source discards a handler's failure — a refused
-- send reports a successful invocation, so nothing outside the handler can observe it.
CREATE TABLE send_failures (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  failed_at INTEGER NOT NULL,
  reason TEXT NOT NULL
) STRICT;

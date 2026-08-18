-- One row per thing the scheduled handler did, in the order it did it. The spike reads
-- this table through a `fetch` route, because a cron handler has no response to assert
-- against and Alchemy's cron event source discards the handler's failure (see README).
CREATE TABLE IF NOT EXISTS attempts (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  cron TEXT NOT NULL,
  stage TEXT NOT NULL,
  detail TEXT
) STRICT;

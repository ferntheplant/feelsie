CREATE TABLE prompts (
  date TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  sent_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > sent_at),
  answered_at INTEGER
) STRICT;

CREATE TABLE entries (
  -- @attests core/entry/one-per-local-date
  date TEXT PRIMARY KEY,
  -- @attests:end
  -- @attests core/entry/measures-are-one-to-ten
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 10),
  energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 10),
  sleep INTEGER NOT NULL CHECK (sleep BETWEEN 1 AND 10),
  -- @attests:end
  note TEXT
) STRICT;

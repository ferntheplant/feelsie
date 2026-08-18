-- D1 can commit a write and lose the response. The adapter retries transient failures, so each
-- send attempt needs an identity that survives that retry. Existing rows get identities from
-- their primary keys; new rows receive UUIDs from the scheduled handler.
ALTER TABLE send_failures ADD COLUMN attempt_id TEXT;

UPDATE send_failures SET attempt_id = 'legacy-' || seq;

CREATE UNIQUE INDEX send_failures_attempt ON send_failures (attempt_id);

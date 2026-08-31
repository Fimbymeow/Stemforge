CREATE TABLE waitlist_subscriptions (
  email TEXT PRIMARY KEY COLLATE NOCASE
    CHECK (length(email) BETWEEN 3 AND 254),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  source TEXT NOT NULL DEFAULT 'website'
    CHECK (source = 'website')
);

CREATE INDEX waitlist_subscriptions_created_at
  ON waitlist_subscriptions (created_at DESC);

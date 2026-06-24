CREATE TABLE "notifications" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "user_id"      TEXT NOT NULL,
  "from_user_id" TEXT,
  "type"         TEXT NOT NULL,
  "post_id"      TEXT,
  "read"         INTEGER NOT NULL DEFAULT 0,
  "created_at"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notifications_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

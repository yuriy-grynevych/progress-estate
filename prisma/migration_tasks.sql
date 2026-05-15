CREATE TABLE IF NOT EXISTS "tasks" (
  "id"           TEXT        NOT NULL,
  "title"        TEXT        NOT NULL,
  "description"  TEXT,
  "dueAt"        TIMESTAMP(3),
  "isDone"       BOOLEAN     NOT NULL DEFAULT false,
  "reminderSent" BOOLEAN     NOT NULL DEFAULT false,
  "userId"       TEXT        NOT NULL,
  "contactId"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tasks_userId_fkey"   FOREIGN KEY ("userId")    REFERENCES "users"("id")    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT "tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tasks_userId_idx" ON "tasks"("userId");
CREATE INDEX IF NOT EXISTS "tasks_dueAt_idx"  ON "tasks"("dueAt");

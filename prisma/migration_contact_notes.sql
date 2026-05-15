CREATE TABLE IF NOT EXISTS "contact_notes" (
  "id"        TEXT         NOT NULL,
  "contactId" TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "text"      TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_notes_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "contact_notes_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contact_notes_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "users"("id")    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "contact_notes_contactId_idx" ON "contact_notes"("contactId");

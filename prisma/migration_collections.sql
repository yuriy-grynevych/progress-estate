CREATE TABLE "collections" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

CREATE TABLE "collection_items" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collection_items_collectionId_propertyId_key" ON "collection_items"("collectionId", "propertyId");
CREATE INDEX "collection_items_collectionId_idx" ON "collection_items"("collectionId");

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_items"
  ADD CONSTRAINT "collection_items_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "collections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_items"
  ADD CONSTRAINT "collection_items_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

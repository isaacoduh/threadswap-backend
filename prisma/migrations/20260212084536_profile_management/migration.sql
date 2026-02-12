/*
  Data-safe enum migration for Listing.category and Listing.condition.

  Fixes:
  - avoids DROP COLUMN (which loses data)
  - handles NULLs
  - normalizes values for enum casting
*/

-- 0) Ensure enums exist (safe even if already created)
DO $$ BEGIN
  CREATE TYPE "Category" AS ENUM ('TOPS','BOTTOMS','DRESSES','OUTERWEAR','SHOES','ACCESSORIES','BAGS','JEWELRY','OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Condition" AS ENUM ('NEW_WITH_TAGS','NEW_WITHOUT_TAGS','EXCELLENT','GOOD','FAIR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1) Fix NULLs / blanks first (prevents NOT NULL failures)
UPDATE "Listing"
SET "category" = 'OTHER'
WHERE "category" IS NULL OR btrim("category") = '';

UPDATE "Listing"
SET "condition" = 'GOOD'
WHERE "condition" IS NULL OR btrim("condition") = '';

-- 2) Normalize case (helps if existing data is 'tops', 'Tops', etc.)
UPDATE "Listing" SET "category" = upper("category") WHERE "category" IS NOT NULL;
UPDATE "Listing" SET "condition" = upper("condition") WHERE "condition" IS NOT NULL;

-- 3) Guard: any unknown values -> safe defaults (prevents cast failures)
UPDATE "Listing"
SET "category" = 'OTHER'
WHERE "category" NOT IN ('TOPS','BOTTOMS','DRESSES','OUTERWEAR','SHOES','ACCESSORIES','BAGS','JEWELRY','OTHER');

UPDATE "Listing"
SET "condition" = 'GOOD'
WHERE "condition" NOT IN ('NEW_WITH_TAGS','NEW_WITHOUT_TAGS','EXCELLENT','GOOD','FAIR');

-- 4) Convert types in-place (keeps data)
ALTER TABLE "Listing"
  ALTER COLUMN "category" TYPE "Category" USING ("category"::"Category"),
  ALTER COLUMN "condition" TYPE "Condition" USING ("condition"::"Condition");

-- 5) Now enforce NOT NULL
ALTER TABLE "Listing"
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "condition" SET NOT NULL;

-- 6) User profile fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "avatarBucket" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarKey" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "socials" JSONB;

-- 7) Index
CREATE INDEX IF NOT EXISTS "Listing_category_idx" ON "Listing"("category");

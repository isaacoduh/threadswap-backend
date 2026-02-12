/*
  Warnings:

  - Changed the type of `category` on the `Listing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `condition` on the `Listing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL,
DROP COLUMN "condition",
ADD COLUMN     "condition" "Condition" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarBucket" TEXT,
ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "socials" JSONB;

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

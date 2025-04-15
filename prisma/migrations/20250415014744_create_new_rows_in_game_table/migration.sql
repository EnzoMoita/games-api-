/*
  Warnings:

  - You are about to drop the column `coverImage` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `releaseDate` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `games` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "games" DROP COLUMN "coverImage",
DROP COLUMN "createdAt",
DROP COLUMN "releaseDate",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "background_image" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metacritic" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "playtime" INTEGER,
ADD COLUMN     "rating_top" INTEGER,
ADD COLUMN     "released" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "stores" TEXT[],
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

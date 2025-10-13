/*
  Warnings:

  - Made the column `npm` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `no_phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "npm" SET NOT NULL,
ALTER COLUMN "no_phone" SET NOT NULL;

-- CreateTable
CREATE TABLE "destinations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_place" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "estimated" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

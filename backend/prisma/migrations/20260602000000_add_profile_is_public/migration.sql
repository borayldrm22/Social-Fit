-- Add is_public column to profiles table
ALTER TABLE "profiles" ADD COLUMN "is_public" INTEGER NOT NULL DEFAULT 1;

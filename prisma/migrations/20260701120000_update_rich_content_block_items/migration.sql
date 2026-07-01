-- AlterTable
ALTER TABLE "RichContentBlocks" DROP COLUMN IF EXISTS "heading";
ALTER TABLE "RichContentBlocks" DROP COLUMN IF EXISTS "subheading";
ALTER TABLE "RichContentBlocks" DROP COLUMN IF EXISTS "bullets";
ALTER TABLE "RichContentBlocks" DROP COLUMN IF EXISTS "images";
ALTER TABLE "RichContentBlocks" DROP COLUMN IF EXISTS "links";
ALTER TABLE "RichContentBlocks" ADD COLUMN IF NOT EXISTS "items" JSONB NOT NULL DEFAULT '[]'::jsonb;

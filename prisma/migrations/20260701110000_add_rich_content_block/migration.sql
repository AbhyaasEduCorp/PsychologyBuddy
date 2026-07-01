-- CreateTable
CREATE TABLE IF NOT EXISTS "RichContentBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "heading" TEXT,
    "subheading" TEXT,
    "bullets" JSONB,
    "images" JSONB,
    "links" JSONB,

    CONSTRAINT "RichContentBlocks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RichContentBlocks" ADD CONSTRAINT "RichContentBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE;

-- AlterTable
ALTER TABLE "ConversationMessage" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'TEXT';

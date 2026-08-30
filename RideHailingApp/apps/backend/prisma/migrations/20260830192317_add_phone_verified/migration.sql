-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

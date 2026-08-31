-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "licenseDocUrl",
ADD COLUMN     "licenseDocBackUrl" TEXT,
ADD COLUMN     "licenseDocFrontUrl" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "insuranceDocUrl" TEXT,
ADD COLUMN     "photoBackUrl" TEXT,
ADD COLUMN     "photoInteriorUrl" TEXT,
ADD COLUMN     "photoFrontUrl" TEXT,
ADD COLUMN     "photoSideUrl" TEXT,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "make" DROP NOT NULL,
ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "registrationNumber" DROP NOT NULL,
ALTER COLUMN "registrationDocUrl" DROP NOT NULL;

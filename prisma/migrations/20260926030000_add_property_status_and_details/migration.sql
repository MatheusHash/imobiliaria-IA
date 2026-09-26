-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "condoFee" DECIMAL(12,2),
ADD COLUMN     "furnished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iptu" DECIMAL(12,2),
ADD COLUMN     "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "petFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");


-- CreateEnum
CREATE TYPE "PortalName" AS ENUM ('ZAP', 'VIVAREAL', 'OLX');

-- CreateEnum
CREATE TYPE "PortalSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'ERROR');

-- CreateTable
CREATE TABLE "PortalListing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "portal" "PortalName" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "PortalSyncStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "PortalListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalCredential" (
    "id" TEXT NOT NULL,
    "portal" "PortalName" NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalListing_propertyId_portal_key" ON "PortalListing"("propertyId", "portal");

-- CreateIndex
CREATE UNIQUE INDEX "PortalCredential_portal_key" ON "PortalCredential"("portal");

-- AddForeignKey
ALTER TABLE "PortalListing" ADD CONSTRAINT "PortalListing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

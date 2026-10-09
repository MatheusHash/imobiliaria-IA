-- CreateTable
CREATE TABLE "FinancingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultRateYearly" DECIMAL(5,2) NOT NULL,
    "minDownPaymentPct" DECIMAL(5,2) NOT NULL,
    "maxMonths" INTEGER NOT NULL DEFAULT 420,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingSettings_pkey" PRIMARY KEY ("id")
);

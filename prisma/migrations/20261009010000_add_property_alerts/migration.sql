-- CreateTable
CREATE TABLE "PropertyAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmToken" TEXT NOT NULL,
    "cancelToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAlert_confirmToken_key" ON "PropertyAlert"("confirmToken");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAlert_cancelToken_key" ON "PropertyAlert"("cancelToken");

-- CreateIndex
CREATE INDEX "PropertyAlert_email_idx" ON "PropertyAlert"("email");

-- CreateIndex
CREATE INDEX "PropertyAlert_active_confirmed_idx" ON "PropertyAlert"("active", "confirmed");

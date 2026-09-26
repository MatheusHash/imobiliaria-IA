-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "code" SERIAL NOT NULL;

-- Os códigos começam em 1001 e seguem a ordem de cadastro dos imóveis existentes.
UPDATE "Property" AS p
SET "code" = 1000 + ordered.position
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS position
  FROM "Property"
) AS ordered
WHERE p."id" = ordered."id";

SELECT setval(
  pg_get_serial_sequence('"Property"', 'code'),
  GREATEST(COALESCE(MAX("code"), 0), 1000)
)
FROM "Property";

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

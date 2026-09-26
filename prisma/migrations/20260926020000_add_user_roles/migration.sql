-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CORRETOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CORRETOR';


-- Usuários existentes eram administradores do sistema.
UPDATE "User" SET "role" = 'ADMIN';

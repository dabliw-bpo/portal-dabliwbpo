-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'PAYSLIP';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "referenceMonth" TEXT;

-- AlterTable
ALTER TABLE "Signature" ADD COLUMN     "imageData" TEXT;

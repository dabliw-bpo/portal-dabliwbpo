-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN     "option" TEXT,
ALTER COLUMN "endDate" DROP NOT NULL;

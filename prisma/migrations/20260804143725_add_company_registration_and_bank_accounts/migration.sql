-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "branchType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "federalEntity" TEXT,
ADD COLUMN     "legalNature" TEXT,
ADD COLUMN     "mainActivity" TEXT,
ADD COLUMN     "openingDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "registrationStatus" TEXT,
ADD COLUMN     "registrationStatusDate" TIMESTAMP(3),
ADD COLUMN     "registrationStatusReason" TEXT,
ADD COLUMN     "secondaryActivities" TEXT,
ADD COLUMN     "specialStatus" TEXT,
ADD COLUMN     "specialStatusDate" TIMESTAMP(3),
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "tradeName" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "agency" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "cnpj" TEXT,
    "pixKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_companyId_idx" ON "BankAccount"("companyId");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

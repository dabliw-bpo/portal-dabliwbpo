-- AlterTable
ALTER TABLE "User" ADD COLUMN     "admissionDate" TIMESTAMP(3),
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "birthdayGreetedYear" INTEGER,
ADD COLUMN     "cpf" TEXT;

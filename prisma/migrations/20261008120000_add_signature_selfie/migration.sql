-- Selfie tirada no ato da assinatura. Só colunas novas e opcionais: as
-- assinaturas já feitas continuam como estão, sem selfie.
-- AlterTable
ALTER TABLE "Signature" ADD COLUMN     "selfieHash" TEXT,
ADD COLUMN     "selfiePath" TEXT,
ADD COLUMN     "selfieSkipReason" TEXT,
ADD COLUMN     "selfieSource" TEXT;

-- AlterTable
ALTER TABLE "SignatureRejection" ADD COLUMN     "selfieHash" TEXT,
ADD COLUMN     "selfiePath" TEXT;

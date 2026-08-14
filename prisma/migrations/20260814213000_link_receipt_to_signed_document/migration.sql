-- AlterTable
ALTER TABLE "PaymentReceipt" ADD COLUMN     "documentId" TEXT;
-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_documentId_key" ON "PaymentReceipt"("documentId");
-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Via do documento com a assinatura manuscrita carimbada. O arquivo original
-- em "filePath" permanece intocado, porque é dele que sai o "fileHash" gravado
-- no relatorio de auditoria.
ALTER TABLE "Document" ADD COLUMN "signedFilePath" TEXT;

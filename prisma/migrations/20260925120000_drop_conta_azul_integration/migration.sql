-- A integração com o Conta Azul foi cancelada: a tela, as rotas e a
-- biblioteca saíram do app, e os tokens guardados vão junto.
-- DropForeignKey
ALTER TABLE "ContaAzulIntegration" DROP CONSTRAINT "ContaAzulIntegration_companyId_fkey";

-- DropTable
DROP TABLE "ContaAzulIntegration";

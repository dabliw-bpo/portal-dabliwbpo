-- O envio automático de parabéns foi eliminado; só ficou o lembrete interno
-- no painel. A coluna que evitava repetir o envio não tem mais uso.
-- AlterTable
ALTER TABLE "User" DROP COLUMN "birthdayGreetedYear";

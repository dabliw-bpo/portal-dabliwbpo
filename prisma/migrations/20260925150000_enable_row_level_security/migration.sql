-- Trava de acesso por linha ligada em todas as tabelas, sem nenhuma política.
-- O portal não é afetado: ele entra como "postgres", dono das tabelas e com
-- permissão para ignorar RLS. Já uma chave publicável do Supabase, se algum
-- dia existir e vazar, passa a não ler nem escrever nada por padrão.
ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistTemplateItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DepartmentMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GenerationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentReceipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceContract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Signature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SignatureRejection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskChecklistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

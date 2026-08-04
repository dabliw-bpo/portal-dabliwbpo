"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireCompanyAccess } from "@/lib/authz";
import { disconnectCompany } from "@/lib/conta-azul";

export async function disconnectContaAzulAction(companyId: string): Promise<void> {
  const session = await auth();
  requireCompanyAccess(session, companyId);

  await disconnectCompany(companyId);

  revalidatePath(`/admin/empresas/${companyId}/integracoes`);
}

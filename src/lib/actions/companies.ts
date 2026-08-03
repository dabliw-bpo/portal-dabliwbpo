"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createCompanySchema } from "@/lib/validations/company";

export type CreateCompanyState = {
  error?: string;
};

export async function createCompanyAction(
  _prevState: CreateCompanyState,
  formData: FormData
): Promise<CreateCompanyState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = createCompanySchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.company.create({
    data: {
      name: parsed.data.name,
      cnpj: parsed.data.cnpj,
    },
  });

  revalidatePath("/admin/empresas");
  redirect("/admin/empresas");
}

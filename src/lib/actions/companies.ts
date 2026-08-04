"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema, companyRegistrationSchema } from "@/lib/validations/company";

export type CompanyFormState = {
  error?: string;
  success?: boolean;
};

export type BankAccountFormState = {
  error?: string;
  success?: boolean;
};

/** Date inputs submit `yyyy-mm-dd`, which parses to UTC midnight. */
function toDate(value: string | undefined): Date | null {
  return value ? new Date(value) : null;
}

/**
 * Maps validated Cartão CNPJ input onto Prisma column values. Optional fields
 * collapse to `null` rather than `undefined` so clearing a field in the form
 * actually clears it in the database.
 */
function registrationData(data: ReturnType<typeof companyRegistrationSchema.parse>) {
  return {
    name: data.name,
    cnpj: data.cnpj ?? null,
    tradeName: data.tradeName ?? null,
    openingDate: toDate(data.openingDate),
    branchType: data.branchType ?? null,
    legalNature: data.legalNature ?? null,
    companySize: data.companySize ?? null,
    mainActivity: data.mainActivity ?? null,
    secondaryActivities: data.secondaryActivities ?? null,
    street: data.street ?? null,
    streetNumber: data.streetNumber ?? null,
    complement: data.complement ?? null,
    district: data.district ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    zipCode: data.zipCode ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    federalEntity: data.federalEntity ?? null,
    registrationStatus: data.registrationStatus ?? null,
    registrationStatusDate: toDate(data.registrationStatusDate),
    registrationStatusReason: data.registrationStatusReason ?? null,
    specialStatus: data.specialStatus ?? null,
    specialStatusDate: toDate(data.specialStatusDate),
  };
}

function parseRegistration(formData: FormData) {
  return companyRegistrationSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    tradeName: formData.get("tradeName"),
    openingDate: formData.get("openingDate"),
    branchType: formData.get("branchType"),
    legalNature: formData.get("legalNature"),
    companySize: formData.get("companySize"),
    mainActivity: formData.get("mainActivity"),
    secondaryActivities: formData.get("secondaryActivities"),
    street: formData.get("street"),
    streetNumber: formData.get("streetNumber"),
    complement: formData.get("complement"),
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    federalEntity: formData.get("federalEntity"),
    registrationStatus: formData.get("registrationStatus"),
    registrationStatusDate: formData.get("registrationStatusDate"),
    registrationStatusReason: formData.get("registrationStatusReason"),
    specialStatus: formData.get("specialStatus"),
    specialStatusDate: formData.get("specialStatusDate"),
  });
}

export async function createCompanyAction(
  _prevState: CompanyFormState,
  formData: FormData
): Promise<CompanyFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseRegistration(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const company = await prisma.company.create({ data: registrationData(parsed.data) });

  revalidatePath("/admin/empresas");
  redirect(`/admin/empresas/${company.id}/cadastro`);
}

export async function updateCompanyRegistrationAction(
  companyId: string,
  _prevState: CompanyFormState,
  formData: FormData
): Promise<CompanyFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseRegistration(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { error: "Empresa não encontrada." };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: registrationData(parsed.data),
  });

  revalidatePath("/admin/empresas");
  revalidatePath(`/admin/empresas/${companyId}/cadastro`);
  return { success: true };
}

function parseBankAccount(formData: FormData) {
  return bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    bankCode: formData.get("bankCode"),
    agency: formData.get("agency"),
    accountNumber: formData.get("accountNumber"),
    cnpj: formData.get("cnpj"),
    pixKey: formData.get("pixKey"),
  });
}

function bankAccountData(data: ReturnType<typeof bankAccountSchema.parse>) {
  return {
    bankName: data.bankName,
    bankCode: data.bankCode ?? null,
    agency: data.agency,
    accountNumber: data.accountNumber,
    cnpj: data.cnpj ?? null,
    pixKey: data.pixKey ?? null,
  };
}

export async function createBankAccountAction(
  companyId: string,
  _prevState: BankAccountFormState,
  formData: FormData
): Promise<BankAccountFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseBankAccount(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { error: "Empresa não encontrada." };
  }

  await prisma.bankAccount.create({
    data: { companyId, ...bankAccountData(parsed.data) },
  });

  revalidatePath(`/admin/empresas/${companyId}/bancos`);
  return { success: true };
}

export async function updateBankAccountAction(
  accountId: string,
  _prevState: BankAccountFormState,
  formData: FormData
): Promise<BankAccountFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseBankAccount(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    return { error: "Conta bancária não encontrada." };
  }

  await prisma.bankAccount.update({
    where: { id: accountId },
    data: bankAccountData(parsed.data),
  });

  revalidatePath(`/admin/empresas/${account.companyId}/bancos`);
  return { success: true };
}

export async function deleteBankAccountAction(accountId: string): Promise<void> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    return;
  }

  await prisma.bankAccount.delete({ where: { id: accountId } });

  revalidatePath(`/admin/empresas/${account.companyId}/bancos`);
}

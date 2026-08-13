import { getCompanyLogoUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";

export type PortalBrand = { name: string; logoUrl: string | null };

/**
 * The signed-in user's own company, shown in the portal header in place of the
 * DABLIW mark. Null when they belong to no company (admin and the internal
 * activity roles), which leaves the platform's own branding in place.
 */
export async function loadCompanyBrand(
  companyId: string | null | undefined
): Promise<PortalBrand | null> {
  if (!companyId) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, logoPath: true },
  });

  if (!company) {
    return null;
  }

  return { name: company.name, logoUrl: getCompanyLogoUrl(company.logoPath) };
}

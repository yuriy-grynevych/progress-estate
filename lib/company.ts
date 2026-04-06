import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/constants";

export type CompanyData = {
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
};

export async function getCompanySettings(): Promise<CompanyData> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings`
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      phone:     map.phone     ?? COMPANY.phone,
      email:     map.email     ?? COMPANY.email,
      address:   map.address   ?? COMPANY.address,
      instagram: map.instagram ?? COMPANY.instagram,
      facebook:  map.facebook  ?? COMPANY.facebook ?? "",
    };
  } catch {
    return {
      phone:     COMPANY.phone,
      email:     COMPANY.email,
      address:   COMPANY.address,
      instagram: COMPANY.instagram,
      facebook:  COMPANY.facebook ?? "",
    };
  }
}

import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/constants";

export type CompanyData = {
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
};

export type SalesPlan = {
  target: number;
  label: string;
  from: string | null;
};

export async function getSalesPlan(): Promise<SalesPlan> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings WHERE key IN ('sales_plan_target','sales_plan_label','sales_plan_from')`
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      target: parseInt(map.sales_plan_target ?? "0", 10) || 0,
      label:  map.sales_plan_label ?? "",
      from:   map.sales_plan_from  || null,
    };
  } catch {
    return { target: 0, label: "", from: null };
  }
}

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

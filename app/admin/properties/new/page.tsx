import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PropertyForm from "@/components/admin/PropertyForm";


export const metadata = {
  title: "Нова нерухомість | Admin",
};

export default async function NewPropertyPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as "ADMIN" | "EMPLOYEE" ?? "EMPLOYEE";
  const currentUserId = (session?.user as any)?.id as string;
  const currentUserName = (session?.user as any)?.name ?? (session?.user as any)?.email ?? "";

  const [employees, featureOptions] = await Promise.all([
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.feature.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <PropertyForm
      employees={employees}
      featureOptions={featureOptions}
      role={role}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}

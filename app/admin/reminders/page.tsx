import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RemindersManager from "@/components/admin/RemindersManager";

export const metadata = { title: "Нагадування | Admin" };

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const where =
    role === "ADMIN"
      ? { followUpAt: { not: null } }
      : { followUpAt: { not: null }, assignedUserId: userId };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { followUpAt: "asc" },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Нагадування</h1>
      <RemindersManager initialContacts={contacts as any} role={role as "ADMIN" | "EMPLOYEE"} />
    </div>
  );
}

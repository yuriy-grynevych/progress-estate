import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContactsManager from "@/components/admin/ContactsManager";

export const metadata = { title: "Контакти | Admin" };

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const where = role === "ADMIN" ? {} : { assignedUserId: userId };

  const [contacts, agents] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { assignedUser: { select: { id: true, name: true, email: true } } },
    }),
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Контакти</h1>
      <ContactsManager
        initialContacts={contacts as any}
        agents={agents}
        role={role as "ADMIN" | "EMPLOYEE"}
        currentUserId={userId}
      />
    </div>
  );
}

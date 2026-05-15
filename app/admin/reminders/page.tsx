import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RemindersManager from "@/components/admin/RemindersManager";

export const metadata = { title: "Завдання | Admin" };

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const contactWhere =
    role === "ADMIN"
      ? { followUpAt: { not: null }, deletedAt: null }
      : { followUpAt: { not: null }, assignedUserId: userId, deletedAt: null };

  const taskWhere =
    role === "ADMIN"
      ? { isDone: false }
      : { isDone: false, userId };

  const [contacts, tasks, allContacts, agents] = await Promise.all([
    prisma.contact.findMany({
      where: contactWhere,
      orderBy: { followUpAt: "asc" },
      include: { assignedUser: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: taskWhere,
      orderBy: { dueAt: "asc" },
      include: { contact: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.contact.findMany({
      where: role === "ADMIN" ? {} : { assignedUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Завдання</h1>
      <RemindersManager
        initialContacts={contacts as any}
        initialTasks={tasks as any}
        contactOptions={allContacts}
        agents={agents}
        role={role as "ADMIN" | "EMPLOYEE"}
        currentUserId={userId}
      />
    </div>
  );
}

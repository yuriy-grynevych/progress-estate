import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersManager from "@/components/admin/UsersManager";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      photoUrl: true,
      agentToken: true,
      createdAt: true,
      _count: { select: { assignedProperties: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Працівники</h1>
      <UsersManager initialUsers={users} />
    </div>
  );
}

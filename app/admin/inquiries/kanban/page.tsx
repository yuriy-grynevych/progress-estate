import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import InquiryKanban from "@/components/admin/InquiryKanban";
import { List, Kanban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InquiryKanbanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session.user as any)?.id as string;

  const where = role === "ADMIN" ? {} : {
    OR: [
      { assignedUserId: userId },
      { referredByUserId: userId },
      { propertyId: null },
      { property: { assignedUserId: userId } },
    ],
  };

  const [inquiries, agents, allInquiries] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { titleUk: true, slug: true } },
        assignedUser: { select: { id: true, name: true, email: true, accentColor: true } },
      },
    }),
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true, accentColor: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.inquiry.count({ where }),
  ]);

  const cards = inquiries.map((inq, i) => ({
    id: inq.id,
    name: inq.name,
    phone: inq.phone,
    message: inq.message,
    source: inq.source,
    funnelStage: (inq as any).funnelStage ?? "NEW",
    deadline: (inq as any).deadline ? (inq as any).deadline.toISOString() : null,
    createdAt: inq.createdAt.toISOString(),
    assignedUser: (inq as any).assignedUser ?? null,
    property: inq.property,
    seqNum: allInquiries - i,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          Воронка заявок
          <span className="ml-2 text-base font-normal text-gray-400">({allInquiries})</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/inquiries"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-navy-900 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition"
          >
            <List className="w-4 h-4" />
            Список
          </Link>
          <Link
            href="/admin/inquiries/kanban"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-navy-900 text-white rounded-xl"
          >
            <Kanban className="w-4 h-4" />
            Канбан
          </Link>
        </div>
      </div>

      <InquiryKanban initialCards={cards} agents={agents} />
    </div>
  );
}

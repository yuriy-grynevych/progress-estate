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

  const inquiryWhere = role === "ADMIN"
    ? { inFunnel: true } as any
    : { inFunnel: true, assignedUserId: userId } as any;

  const [inquiries, agents, allInquiries] = await Promise.all([
    prisma.inquiry.findMany({
      where: inquiryWhere,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { titleUk: true, slug: true } },
        assignedUser: { select: { id: true, name: true, email: true, accentColor: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      // @ts-ignore — notes added via raw SQL migration
    }),
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true, accentColor: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.inquiry.count({ where: inquiryWhere }),
  ]);

  const cards = inquiries.map((inq, i) => ({
    id: inq.id,
    name: inq.name,
    phone: inq.phone,
    message: inq.message,
    notes: (inq as any).notes ?? null,
    source: inq.source,
    funnelStage: (inq as any).funnelStage ?? "NEW",
    deadline: (inq as any).deadline ? (inq as any).deadline.toISOString() : null,
    createdAt: inq.createdAt.toISOString(),
    assignedUser: (inq as any).assignedUser ?? null,
    createdBy: (inq as any).createdBy ?? null,
    property: inq.property,
    seqNum: allInquiries - i,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h1 className="text-lg font-bold text-navy-900">
          Воронка заявок
          <span className="ml-2 text-sm font-normal text-gray-400">({allInquiries})</span>
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

      <div className="flex-1">
        <InquiryKanban initialCards={cards} agents={agents} role={role} currentUserId={userId} />
      </div>
    </div>
  );
}

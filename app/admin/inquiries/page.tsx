import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import InquiryStatusSelect from "@/components/admin/InquiryStatusSelect";
import InquiryAssignSelect from "@/components/admin/InquiryAssignSelect";
import AddToFunnelButton from "@/components/admin/AddToFunnelButton";
import { Phone, Mail, Lock, Kanban, List } from "lucide-react";
import ChatHistoryBlock from "@/components/admin/ChatHistoryBlock";

const statusFilter = ["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"] as const;

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const isAdmin = role === "ADMIN";

  const currentStatus = searchParams.status ?? "ALL";
  const statusWhere = currentStatus !== "ALL" ? { status: currentStatus as any } : {};

  // Employees see only their assigned inquiries; everyone only sees inFunnel=false here
  const roleWhere = isAdmin ? {} : { assignedUserId: userId };
  const where = { ...statusWhere, ...roleWhere, inFunnel: false } as any;

  const [inquiries, agents] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { titleUk: true, slug: true, assignedUserId: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    }),
    isAdmin
      ? prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const newCount = isAdmin
    ? await prisma.inquiry.count({ where: { status: "NEW", inFunnel: false } as any })
    : await prisma.inquiry.count({ where: { assignedUserId: userId, status: "NEW", inFunnel: false } as any });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {isAdmin ? "Запити клієнтів" : "Мої запити"}
          {newCount > 0 && (
            <span className="ml-2 text-sm font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {newCount} нових
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/inquiries" className="flex items-center gap-1.5 px-3 py-2 text-sm bg-navy-900 text-white rounded-xl">
            <List className="w-4 h-4" /> Список
          </Link>
          <Link href="/admin/inquiries/kanban" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-navy-900 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition">
            <Kanban className="w-4 h-4" /> Воронка
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {statusFilter.map((s) => {
          const labels: Record<string, string> = {
            ALL: "Всі",
            NEW: "Нові",
            READ: "Прочитані",
            REPLIED: "Відповіді",
            ARCHIVED: "Архів",
          };
          return (
            <a
              key={s}
              href={s === "ALL" ? "/admin/inquiries" : `/admin/inquiries?status=${s}`}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
                currentStatus === s
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 shadow-sm"
              }`}
            >
              {labels[s]}
            </a>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-4">
        {inquiries.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-gold-300">
            Немає запитів
          </div>
        )}
        {inquiries.map((inq) => {
          const isGeneral = !inq.propertyId;

          return (
            <div key={inq.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gold-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-navy-900">{inq.name}</span>
                    <InquiryStatusSelect id={inq.id} currentStatus={inq.status} />
                    {isAdmin && (
                      <>
                        <InquiryAssignSelect
                          id={inq.id}
                          currentAgentId={(inq as any).assignedUser?.id ?? null}
                          agents={agents}
                        />
                        <AddToFunnelButton id={inq.id} />
                      </>
                    )}
                    {isGeneral && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Загальне
                      </span>
                    )}
                    <span className="text-gray-400 text-xs ml-auto">
                      {new Date(inq.createdAt).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {inq.property && (
                    <p className="text-xs text-gray-400 mb-2">
                      Об&apos;єкт:{" "}
                      <a
                        href={`/uk/listings/${inq.property.slug}`}
                        target="_blank"
                        className="text-gold-500 hover:underline"
                      >
                        {inq.property.titleUk}
                      </a>
                    </p>
                  )}

                  <p className="text-gray-700 text-sm whitespace-pre-line">{inq.message}</p>
                </div>
              </div>

              {/* Chat history */}
              {(inq as any).chatHistory && ((inq as any).chatHistory as any[]).length > 0 && (
                <ChatHistoryBlock history={(inq as any).chatHistory} source={(inq as any).source} />
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <a
                  href={`mailto:${inq.email}`}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 transition"
                >
                  <Mail className="w-4 h-4" />
                  {inq.email}
                </a>
                {inq.phone && (
                  <a
                    href={`tel:${inq.phone}`}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 transition"
                  >
                    <Phone className="w-4 h-4" />
                    {inq.phone}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

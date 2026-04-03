import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InquiryStatusSelect from "@/components/admin/InquiryStatusSelect";
import { Phone, Mail, Lock, Bot, ChevronDown, ChevronUp } from "lucide-react";
import ChatHistoryBlock from "@/components/admin/ChatHistoryBlock";

const statusFilter = ["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"] as const;

async function getInquiries(status?: string, role?: string, userId?: string) {
  const statusWhere =
    status && status !== "ALL" ? { status: status as any } : {};

  const roleWhere =
    role === "ADMIN"
      ? {}
      : {
          OR: [
            { propertyId: null },
            { property: { assignedUserId: userId } },
            { referredByUserId: userId },
          ],
        };

  return prisma.inquiry.findMany({
    where: { ...statusWhere, ...roleWhere },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          titleUk: true,
          slug: true,
          assignedUserId: true,
        },
      },
    },
  });
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const currentStatus = searchParams.status ?? "ALL";
  const inquiries = await getInquiries(currentStatus, role, userId);

  const newCountWhere =
    role === "ADMIN"
      ? { status: "NEW" as const }
      : {
          status: "NEW" as const,
          OR: [
            { propertyId: null },
            { property: { assignedUserId: userId } },
            { referredByUserId: userId },
          ],
        };
  const newCount = await prisma.inquiry.count({ where: newCountWhere });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {role === "ADMIN" ? "Запити клієнтів" : "Мої запити"}
          {newCount > 0 && (
            <span className="ml-2 text-sm font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {newCount} нових
            </span>
          )}
        </h1>
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
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm">
            Немає запитів
          </div>
        )}
        {inquiries.map((inq) => {
          const isOwned = role === "ADMIN" || inq.property?.assignedUserId === userId || (inq as any).referredByUserId === userId;
          const isGeneral = !inq.propertyId;

          return (
            <div key={inq.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-navy-900">{inq.name}</span>
                    <InquiryStatusSelect id={inq.id} currentStatus={inq.status} />
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
                      Об'єкт:{" "}
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
                {isOwned ? (
                  <>
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
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Lock className="w-4 h-4" />
                    Контактні дані доступні лише відповідальному агенту
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

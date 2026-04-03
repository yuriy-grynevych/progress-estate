import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";
import ToggleStatusButton from "@/components/admin/ToggleStatusButton";
import CopyAgentLinkButton from "@/components/admin/CopyAgentLinkButton";
import { PlusCircle, Eye, Pencil } from "lucide-react";

async function getProperties(search?: string, role?: string, userId?: string) {
  const searchWhere = search
    ? {
        OR: [
          { titleUk: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const properties = await prisma.property.findMany({
    where: searchWhere,
    orderBy: { updatedAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
  });

  // For employees: own properties first, then others — both sorted by updatedAt desc
  if (role === "EMPLOYEE" && userId) {
    const own = properties.filter((p) => p.assignedUserId === userId);
    const others = properties.filter((p) => p.assignedUserId !== userId);
    return [...own, ...others];
  }

  return properties;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const properties = await getProperties(searchParams.search, role, userId);

  // Fetch current user's agentToken for copy-link button
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentToken: true },
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          Нерухомість
          <span className="text-gray-400 font-normal text-base ml-2">({properties.length})</span>
        </h1>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Додати
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.search}
          placeholder="Пошук за назвою або адресою..."
          className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Нерухомість</th>
                <th className="px-4 py-3 font-medium text-gray-500">Ціна</th>
                <th className="px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 font-medium text-gray-500">Агент</th>
                <th className="px-4 py-3 font-medium text-gray-500">Перегляди</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Нерухомість не знайдена
                  </td>
                </tr>
              )}
              {properties.map((property) => {
                const isOwn = property.assignedUserId === userId;
                const canEdit = role === "ADMIN" || isOwn;

                return (
                  <tr key={property.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-navy-900 line-clamp-1">
                          {property.titleUk}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                          {property.address ?? property.district ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {formatPrice(Number(property.price), property.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <ToggleStatusButton
                          id={property.id}
                          field="status"
                          currentValue={property.status}
                        />
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {property.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {property.assignedUser ? (
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          isOwn
                            ? "bg-gold-100 text-gold-600 font-medium"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {property.assignedUser.name ?? property.assignedUser.email}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {property.viewCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/uk/listings/${property.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-navy-900 transition"
                          title="Переглянути на сайті"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {currentUser?.agentToken && (
                          <CopyAgentLinkButton
                            slug={property.slug}
                            locale="uk"
                            agentToken={currentUser.agentToken}
                          />
                        )}
                        {canEdit && (
                          <>
                            <Link
                              href={`/admin/properties/${property.id}`}
                              className="text-gray-400 hover:text-navy-900 transition"
                              title="Редагувати"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            {role === "ADMIN" && <DeletePropertyButton id={property.id} />}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

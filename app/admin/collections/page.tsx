import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, FolderOpen, Pencil, Share2 } from "lucide-react";
import DeleteCollectionButton from "@/components/admin/DeleteCollectionButton";
import CopyCollectionLinkButton from "@/components/admin/CopyCollectionLinkButton";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const collections = await prisma.collection.findMany({
    where: role === "ADMIN" ? undefined : { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3">
          Колекції
          <span className="text-gray-400 font-normal text-base">({collections.length})</span>
        </h1>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Нова колекція
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Нема колекцій. Створіть першу →</p>
          <Link
            href="/admin/collections/new"
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black/90 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Створити колекцію
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              <Link href={`/admin/collections/${col.id}`} className="flex-1 min-w-0 hover:opacity-80 transition">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="w-4 h-4 text-gold-500 flex-shrink-0" />
                  <span className="font-semibold text-navy-900 truncate hover:text-gold-600 transition">{col.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    {col._count.items} об'єктів
                  </span>
                </div>
                <p className="text-xs text-gray-400">Створено: {fmtDate(col.createdAt)}</p>
              </Link>

              <div className="flex items-center gap-1 flex-shrink-0">
                <CopyCollectionLinkButton slug={col.slug} />
                <Link
                  href={`/admin/collections/${col.id}`}
                  className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100"
                  title="Редагувати"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <DeleteCollectionButton id={col.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

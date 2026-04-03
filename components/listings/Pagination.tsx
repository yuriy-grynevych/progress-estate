"use client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages
  );

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-navy-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((page, i) => {
        const prev = pages[i - 1];
        return (
          <span key={page} className="flex items-center gap-1">
            {prev && page - prev > 1 && (
              <span className="px-2 text-gray-400">…</span>
            )}
            <button
              onClick={() => goTo(page)}
              className={cn(
                "w-9 h-9 rounded-lg text-sm font-medium transition-colors border",
                currentPage === page
                  ? "bg-black text-white border-navy-900"
                  : "border-gray-200 hover:border-navy-900"
              )}
            >
              {page}
            </button>
          </span>
        );
      })}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-navy-900 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

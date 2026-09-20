"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TicketPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export const TicketPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: TicketPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <span>Showing {totalItems} {totalItems === 1 ? "ticket" : "tickets"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-200">{startIdx}</span> to{" "}
        <span className="font-semibold text-slate-200">{endIdx}</span> of{" "}
        <span className="font-semibold text-slate-200">{totalItems}</span> tickets
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-medium text-slate-400">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

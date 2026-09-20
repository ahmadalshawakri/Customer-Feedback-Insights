"use client";

import { useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { TicketStatus } from "@/types";

export const TicketFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "";
  const currentComplex = searchParams.get("is_complex");

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const statuses: { label: string; value: TicketStatus | "" }[] = [
    { label: "All Statuses", value: "" },
    { label: "Open", value: "open" },
    { label: "Pending AI", value: "pending_analysis" },
    { label: "Analyzed", value: "analyzed" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
  ];

  const hasFilters = Boolean(currentStatus || currentComplex !== null);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          <Filter className="h-3.5 w-3.5 text-indigo-400" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => {
            const isActive = currentStatus === s.value;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => handleFilterChange("status", s.value || null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                  }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <select
          value={currentComplex ?? ""}
          onChange={(e) =>
            handleFilterChange("is_complex", e.target.value === "" ? null : e.target.value)
          }
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
        >
          <option value="">Complexity: All</option>
          <option value="true">Complex Only</option>
          <option value="false">Standard Only</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset filters"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

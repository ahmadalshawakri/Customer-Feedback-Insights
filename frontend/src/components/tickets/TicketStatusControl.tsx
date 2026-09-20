"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBadge, ComplexityBadge } from "@/components/common/Badges";
import { Loader2 } from "lucide-react";
import { useManager } from "@/context/AuthContext";
import type { TicketStatus } from "@/types";

interface TicketStatusControlProps {
  ticketId: string;
  status: TicketStatus;
  isComplex: boolean;
  isManager?: boolean;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending_analysis", label: "Pending AI" },
  { value: "analyzed", label: "Analyzed" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const TicketStatusControl = ({
  ticketId,
  status,
  isComplex,
  isManager: propIsManager,
}: TicketStatusControlProps) => {
  const contextIsManager = useManager();
  const isManager = propIsManager !== undefined ? propIsManager : contextIsManager;

  const router = useRouter();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (payload: { status?: TicketStatus; is_complex?: boolean }) => {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      router.refresh();
    },
  });

  const isPending = updateMutation.isPending;

  if (!isManager) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <ComplexityBadge isComplex={isComplex} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative inline-flex items-center">
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              Status: {s.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => updateMutation.mutate({ is_complex: !isComplex })}
        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19] ${isComplex
          ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 focus-visible:ring-red-500"
          : "border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white focus-visible:ring-slate-500"
          }`}
      >
        {isComplex ? "Mark Standard" : "Mark Complex"}
      </button>

      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />}
    </div>
  );
};

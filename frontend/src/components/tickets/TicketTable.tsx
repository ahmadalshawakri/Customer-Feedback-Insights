"use client";

import Link from "next/link";
import { TicketRow } from "@/components/tickets/TicketRow";
import { Inbox, Sparkles } from "lucide-react";
import { useManager } from "@/context/AuthContext";
import type { TicketRead } from "@/types";

interface TicketTableProps {
  tickets: TicketRead[];
  isManager?: boolean;
}

export const TicketTable = ({ tickets, isManager: propIsManager }: TicketTableProps) => {
  const contextIsManager = useManager();
  const isManager = propIsManager !== undefined ? propIsManager : contextIsManager;

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3">
          <Inbox className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No feedback tickets found</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          There are currently no tickets matching your active filters or none have been submitted yet.
        </p>
        {isManager && (
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Create First Ticket</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl">
      <table className="w-full text-left border-collapse">
        <caption className="sr-only">
          Customer feedback tickets and their AI analysis status
        </caption>
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th scope="col" className="py-3.5 pl-4 pr-3">Ticket & Customer</th>
            <th scope="col" className="py-3.5 px-3">Status</th>
            <th scope="col" className="py-3.5 px-3">AI Category</th>
            <th scope="col" className="py-3.5 px-3">Sentiment</th>
            <th scope="col" className="py-3.5 px-3">Complexity</th>
            <th scope="col" className="py-3.5 pr-4 pl-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

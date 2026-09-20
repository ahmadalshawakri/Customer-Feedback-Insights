import Link from "next/link";
import {
  StatusBadge,
  SentimentBadge,
  CategoryBadge,
  ComplexityBadge,
} from "@/components/common/Badges";
import { ChevronRight, Mail, Clock } from "lucide-react";
import type { TicketRead } from "@/types";

interface TicketRowProps {
  ticket: TicketRead;
}

export const TicketRow = ({ ticket }: TicketRowProps) => {
  const analysis = ticket.analysis;

  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/40 transition group">
      <td className="py-4 pl-4 pr-3">
        <div className="flex flex-col gap-1 max-w-md">
          <Link
            href={`/tickets/${ticket.id}`}
            className="text-sm font-semibold text-white group-hover:text-indigo-300 transition line-clamp-1"
          >
            {ticket.title}
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-500" />
              <span className="truncate max-w-[160px]">{ticket.customer_email}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleString()}</span>
            </span>
          </div>
        </div>
      </td>

      <td className="py-4 px-3 whitespace-nowrap">
        <StatusBadge status={ticket.status} />
      </td>

      <td className="py-4 px-3 whitespace-nowrap">
        {analysis ? (
          <CategoryBadge category={analysis.suggested_category} />
        ) : (
          <span className="text-xs text-slate-500 italic">—</span>
        )}
      </td>

      <td className="py-4 px-3 whitespace-nowrap">
        {analysis ? (
          <SentimentBadge sentiment={analysis.suggested_sentiment} />
        ) : (
          <span className="text-xs text-slate-500 italic">—</span>
        )}
      </td>

      <td className="py-4 px-3 whitespace-nowrap">
        <ComplexityBadge isComplex={ticket.is_complex} />
      </td>

      <td className="py-4 pr-4 pl-3 text-right whitespace-nowrap">
        <Link
          href={`/tickets/${ticket.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-indigo-400 transition"
        >
          <span>View</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
};

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/apiClient";
import { AIAnalysisCard } from "@/components/tickets/AIAnalysisCard";
import { TicketStatusControl } from "@/components/tickets/TicketStatusControl";
import { ArrowLeft, Mail, Clock, MessageSquareText } from "lucide-react";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

const TicketDetailPage = async ({ params }: TicketDetailPageProps) => {
  const { token } = await requireAuth();
  const { id } = await params;

  let ticket;
  try {
    ticket = await api.tickets.get(id, token);
    if (!ticket) {
      notFound();
    }
  } catch (error) {
    throw error;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ticket Queue</span>
        </Link>

        <TicketStatusControl
          ticketId={ticket.id}
          status={ticket.status}
          isComplex={ticket.is_complex}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            ID: {ticket.id}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span suppressHydrationWarning>Created {new Date(ticket.created_at).toLocaleString()}</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {ticket.title}
        </h1>

        <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-300">
          <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="text-slate-500">Customer:</span>
          <span className="font-medium text-slate-200">{ticket.customer_email}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <MessageSquareText className="h-4 w-4 text-indigo-400" />
          <span>Customer Feedback Message</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
          {ticket.body}
        </div>
      </div>

      <AIAnalysisCard
        ticketId={ticket.id}
        initialAnalysis={ticket.analysis}
        ticketStatus={ticket.status}
      />
    </div>
  );
};

export default TicketDetailPage;

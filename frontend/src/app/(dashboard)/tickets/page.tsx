import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/apiClient";
import { TicketListClientWrapper } from "@/components/tickets/TicketListClientWrapper";
import { Inbox, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import type { TicketStatus } from "@/types";

interface TicketsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    is_complex?: string;
  }>;
}

const TicketsPage = async ({ searchParams }: TicketsPageProps) => {
  const { token } = await requireAuth();
  const params = await searchParams;

  const page = params.page ? parseInt(params.page, 10) : 1;
  const status = params.status as TicketStatus | undefined;
  const is_complex = params.is_complex === "true"
    ? true
    : params.is_complex === "false"
      ? false
      : undefined;

  const paginatedData = await api.tickets.list(
    { page, page_size: 15, status, is_complex },
    token
  );

  const analyzedCount = paginatedData.items.filter((t) => t.status === "analyzed").length;
  const pendingCount = paginatedData.items.filter(
    (t) => t.status === "open" || t.status === "pending_analysis"
  ).length;
  const complexCount = paginatedData.items.filter((t) => t.is_complex).length;

  const metricsConfig = [
    {
      id: "total",
      label: "Total Inquiries",
      value: paginatedData.total,
      Icon: Inbox,
      iconTheme: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      id: "pending",
      label: "Needs AI Triage",
      value: pendingCount,
      Icon: Sparkles,
      iconTheme: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "analyzed",
      label: "AI Analyzed",
      value: analyzedCount,
      Icon: CheckCircle2,
      iconTheme: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      id: "complex",
      label: "Complex Tickets",
      value: complexCount,
      Icon: AlertTriangle,
      iconTheme: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Customer Feedback Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review customer inquiries, triage issues, and leverage GenAI analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsConfig.map(({ id, label, value, Icon, iconTheme }) => (
          <div
            key={id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur flex items-center gap-3.5"
          >
            <div className={`p-2.5 rounded-lg border ${iconTheme}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <TicketListClientWrapper
        initialData={paginatedData}
        filters={{ page, status, is_complex }}
      />
    </div>
  );
};

export default TicketsPage;

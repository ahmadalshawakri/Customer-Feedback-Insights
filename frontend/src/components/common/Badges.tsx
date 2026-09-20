import cx from 'classnames'
import type { TicketCategory, TicketSentiment, TicketStatus } from "@/types";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

interface SentimentBadgeProps {
  sentiment: TicketSentiment;
  className?: string;
}

interface CategoryBadgeProps {
  category: TicketCategory;
  className?: string;
}

interface ComplexityBadgeProps {
  isComplex: boolean;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const configs: Record<
    TicketStatus,
    { label: string; bg: string; text: string; }
  > = {
    open: {
      label: "Open",
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-400",
    },
    pending_analysis: {
      label: "Pending AI",
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-400",
    },
    analyzed: {
      label: "Analyzed",
      bg: "bg-purple-500/10 border-purple-500/30",
      text: "text-purple-400",
    },
    resolved: {
      label: "Resolved",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
    },
    closed: {
      label: "Closed",
      bg: "bg-slate-500/10 border-slate-500/30",
      text: "text-slate-400",
    },
  };

  const config = configs[status] || configs.open;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export const SentimentBadge = ({ sentiment, className }: SentimentBadgeProps) => {
  const configs: Record<
    TicketSentiment,
    { label: string; bg: string; text: string; }
  > = {
    positive: {
      label: "Positive",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
    },
    neutral: {
      label: "Neutral",
      bg: "bg-slate-500/10 border-slate-500/30",
      text: "text-slate-300",
    },
    negative: {
      label: "Negative",
      bg: "bg-rose-500/10 border-rose-500/30",
      text: "text-rose-400",
    },
    mixed: {
      label: "Mixed",
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-400",
    },
  };

  const config = configs[sentiment] || configs.neutral;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  return (
    <span
      className={cx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide bg-slate-800 text-slate-300 border border-slate-700",
        className
      )}
    >
      {category}
    </span>
  );
};

export const ComplexityBadge = ({ isComplex, className }: ComplexityBadgeProps) => {
  if (!isComplex) {
    return (
      <span
        className={cx(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50",
          className
        )}
      >
        Standard
      </span>
    );
  }

  return (
    <span
      className={cx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30",
        className
      )}
    >
      Complex
    </span>
  );
};

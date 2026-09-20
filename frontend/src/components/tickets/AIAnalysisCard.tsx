"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
  Check,
} from "lucide-react";
import { CategoryBadge, SentimentBadge } from "@/components/common/Badges";
import type {
  AnalysisRead,
  AnalysisResult,
  TicketCategory,
  TicketSentiment,
} from "@/types";
import { useManager } from "@/context/AuthContext";

interface AIAnalysisCardProps {
  ticketId: string;
  initialAnalysis: AnalysisRead | null;
  ticketStatus?: string;
  isManager?: boolean;
}

const CATEGORIES: TicketCategory[] = ["billing", "technical", "shipping", "account", "general", "other"];
const SENTIMENTS: TicketSentiment[] = ["positive", "neutral", "negative", "mixed"];

export const AIAnalysisCard = ({
  ticketId,
  initialAnalysis,
  isManager: propIsManager,
}: AIAnalysisCardProps) => {
  const contextIsManager = useManager();
  const isManager = propIsManager !== undefined ? propIsManager : contextIsManager;

  const router = useRouter();
  const queryClient = useQueryClient();

  const [suggestion, setSuggestion] = useState<AnalysisResult | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<TicketCategory>("general");
  const [overrideSentiment, setOverrideSentiment] = useState<TicketSentiment>("neutral");
  const [overrideSummary, setOverrideSummary] = useState<string>("");

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to analyze ticket");
      return data as AnalysisResult;
    },
    onSuccess: (result) => {
      setSuggestion(result);
      setOverrideCategory(result.suggested_category);
      setOverrideSentiment(result.suggested_sentiment);
      setOverrideSummary(result.summary);
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_result: suggestion,
          accept_payload: {
            suggested_category: overrideCategory,
            suggested_sentiment: overrideSentiment,
            summary: overrideSummary,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save analysis");
      return data;
    },
    onSuccess: () => {
      setSuggestion(null);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      router.refresh();
    }
  });

  const isAnalyzing = analyzeMutation.isPending;
  const isAccepting = acceptMutation.isPending;
  const displayError = analyzeMutation.error?.message || acceptMutation.error?.message;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-md space-y-5">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              GenAI Triage & Sentiment Analysis
              {initialAnalysis && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Saved & Persisted
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Two-step human-in-the-loop review workflow
            </p>
          </div>
        </div>

        {isManager && !suggestion && (
          <button
            type="button"
            onClick={() => analyzeMutation.mutate()}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{initialAnalysis ? "Re-run AI Analysis" : "Analyze with AI"}</span>
              </>
            )}
          </button>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{displayError}</span>
        </div>
      )}

      {isAnalyzing && (
        <div aria-live="polite" className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center space-y-3 animate-pulse">
          <BrainCircuit className="h-8 w-8 text-indigo-400 mx-auto animate-bounce" />
          <p className="text-sm font-medium text-indigo-300">
            Evaluating feedback sentiment, complexity, and category...
          </p>
          <p className="text-xs text-slate-500">
            Calling LLM Provider via FastAPI backend
          </p>
        </div>
      )}

      {suggestion && !isAnalyzing && (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-5 space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                AI Suggestion Ready (Review & Override)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confidence:</span>
              <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${suggestion.confidence_score >= 0.8
                    ? "bg-emerald-400"
                    : suggestion.confidence_score >= 0.5
                      ? "bg-amber-400"
                      : "bg-rose-400"
                    }`}
                  style={{ width: `${Math.round(suggestion.confidence_score * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                {Math.round(suggestion.confidence_score * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category Override
              </label>
              <select
                value={overrideCategory}
                onChange={(e) => setOverrideCategory(e.target.value as TicketCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()} {cat === suggestion.suggested_category ? "(AI Suggestion)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Sentiment Override
              </label>
              <select
                value={overrideSentiment}
                onChange={(e) => setOverrideSentiment(e.target.value as TicketSentiment)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                {SENTIMENTS.map((sent) => (
                  <option key={sent} value={sent}>
                    {sent.toUpperCase()} {sent === suggestion.suggested_sentiment ? "(AI Suggestion)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Summary & Insights (Editable)
            </label>
            <textarea
              rows={3}
              value={overrideSummary}
              onChange={(e) => setOverrideSummary(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={() => acceptMutation.mutate()}
              disabled={isAccepting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Persisting to DB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Accept & Save Triage</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {initialAnalysis && !suggestion && !isAnalyzing && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Category:</span>
              <CategoryBadge category={initialAnalysis.suggested_category} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sentiment:</span>
              <SentimentBadge sentiment={initialAnalysis.suggested_sentiment} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confidence:</span>
              <span className="text-xs font-bold text-slate-200">
                {Math.round(initialAnalysis.confidence_score * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Executive AI Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              {initialAnalysis.summary}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            <span>
              Reviewed & Accepted by:{" "}
              <span className="text-slate-400 font-medium">{initialAnalysis.reviewed_by || "System"}</span>
            </span>
            <span suppressHydrationWarning>
              Accepted on: {new Date(initialAnalysis.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {!initialAnalysis && !suggestion && !isAnalyzing && (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center space-y-2">
          <Sparkles className="h-7 w-7 text-slate-600 mx-auto" />
          <h3 className="text-xs font-semibold text-slate-300">
            No GenAI Analysis Generated Yet
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {isManager
              ? "Click 'Analyze with AI' to trigger the automated categorization and sentiment analysis."
              : "Support Managers can trigger and accept AI analysis for this ticket."}
          </p>
        </div>
      )}
    </div>
  );
};

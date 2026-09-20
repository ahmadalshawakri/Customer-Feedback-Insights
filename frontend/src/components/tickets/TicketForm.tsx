"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const TicketForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [body, setBody] = useState("");
  const [isComplex, setIsComplex] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const createTicketMutation = useMutation({
    mutationFn: async (payload: { title: string; customer_email: string; body: string; is_complex: boolean }) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create ticket");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      router.push(`/tickets/${data.id}`);
    },
    onError: (err) => {
      setCustomError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    createTicketMutation.mutate({
      title,
      customer_email: customerEmail,
      body,
      is_complex: isComplex,
    });
  };

  const isPending = createTicketMutation.isPending;
  const displayError = customError || (createTicketMutation.isError ? createTicketMutation.error?.message : null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ticket Queue</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Create Support Ticket
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Log customer feedback or support inquiry into the triage queue
          </p>
        </div>

        {displayError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Ticket Subject / Title *
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cannot process credit card payment at checkout"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Customer Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@domain.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="body"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Customer Message / Feedback Body *
            </label>
            <textarea
              id="body"
              required
              rows={5}
              minLength={10}
              maxLength={5000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the full customer message or feedback text here..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 p-3.5 text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition font-sans"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isComplex}
                onChange={(e) => setIsComplex(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19] cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-300">
                Mark as High Complexity / Priority
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href="/tickets"
              className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

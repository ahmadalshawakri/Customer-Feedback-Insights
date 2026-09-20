"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const callbackUrl = searchParams.get("callbackUrl") || "/tickets";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (payload: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
      router.push(callbackUrl);
      router.refresh();
    },
    onError: (err) => {
      setCustomError(err.message);
    }
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCustomError(null);
    loginMutation.mutate({ username, password });
  };

  const isPending = loginMutation.isPending;
  const displayError = customError || (loginMutation.isError ? loginMutation.error?.message : null);

  return (
    <div className="w-full max-w-md space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl space-y-5"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Sign In</h2>
          <p className="text-sm text-slate-400">
            Access your feedback triage dashboard
          </p>
        </div>

        <div aria-live="polite">
          {displayError && (
            <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{displayError}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager or agent"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

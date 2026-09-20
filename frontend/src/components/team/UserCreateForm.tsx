"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { UserRole } from "@/types";

export const UserCreateForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("support_agent");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const createMemberMutation = useMutation({
    mutationFn: async (payload: { username: string; email: string; password: string; role: UserRole }) => {
      const res = await fetch("/api/team/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create user");
      }
      return data;
    },
    onSuccess: (_, variables) => {
      setSuccessMsg(`User "${variables.username}" created successfully with role ${variables.role.toUpperCase()}`);
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("support_agent");
    },
    onError: (err) => {
      setCustomError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setCustomError(null);

    createMemberMutation.mutate({
      username,
      email,
      password,
      role,
    });
  };

  const isPending = createMemberMutation.isPending;
  const displayError = customError || (createMemberMutation.isError ? createMemberMutation.error?.message : null);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-400" />
          <span>Register New Team Member</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Support Managers can provision accounts for agents or other managers
        </p>
      </div>

      <div aria-live="polite">
        {successMsg && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 mb-4 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {displayError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 mb-4 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{displayError}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Username *
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john.doe"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Temporary Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Role Permission *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition"
            >
              <option value="support_agent">Support Agent (Read Only)</option>
              <option value="support_manager">Support Manager (Full Control)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Register Member</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

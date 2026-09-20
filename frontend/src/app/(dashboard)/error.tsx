"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";

interface ErrorBoundaryProps {
    error: Error & { digest?: string };
    reset: () => void;
}

const ErrorBoundary = ({ error, reset }: ErrorBoundaryProps) => {
    useEffect(() => {
        console.error("Application error caught by Next.js boundary:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 mb-4 border border-rose-500/20">
                    <AlertTriangle className="h-6 w-6 text-rose-500" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    We encountered an unexpected issue while trying to load this data.
                </p>
                {error.digest && (
                    <p className="text-xs text-slate-500 font-mono bg-slate-950 p-2 rounded border border-slate-800 mb-6">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        <span>Try Again</span>
                    </button>
                    <Link
                        href="/tickets"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Queue</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;

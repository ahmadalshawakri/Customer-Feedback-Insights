'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    MessagesSquare,
    Plus,
    Users,
    Inbox,
    Sparkles,
    LogOut,
    User,
    Loader2,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserSession } from "@/types";

interface TopNavProps {
    session?: UserSession;
}

export const TopNav = ({ session: propSession }: TopNavProps = {}) => {
    const auth = useAuth();
    const session = propSession || auth.session;
    const isManager = auth.isManager;
    const router = useRouter();
    const pathname = usePathname();

    const [loggingOut, setLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6 lg:gap-8">
                    <Link
                        href="/tickets"
                        className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
                    >
                        <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 group-hover:border-indigo-500/50 transition">
                            <MessagesSquare className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight text-sm sm:text-base flex items-center gap-1.5">
                                <span>Feedback Insights</span>
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                                </span>
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        <Link
                            href="/tickets"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${pathname.startsWith("/tickets") && pathname !== "/tickets/new"
                                ? "bg-slate-800 text-white shadow-sm"
                                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                }`}
                        >
                            <Inbox className="h-4 w-4 text-slate-400" />
                            <span>Tickets</span>
                        </Link>

                        {isManager && (
                            <Link
                                href="/team"
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${pathname.startsWith("/team")
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                    }`}
                            >
                                <Users className="h-4 w-4 text-slate-400" />
                                <span>Team</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    {isManager && (
                        <Link
                            href="/tickets/new"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Ticket</span>
                        </Link>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-full border border-slate-800 bg-slate-900/80">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">
                                {session.userId.length > 18
                                    ? `${session.userId.slice(0, 8)}...`
                                    : session.userId}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isManager
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    }`}
                            >
                                {isManager ? "Manager" : "Agent"}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            aria-label="Sign Out"
                            title="Sign Out"
                            className="flex items-center justify-center p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex lg:hidden items-center gap-2 sm:gap-3">
                    {isManager && (
                        <Link
                            href="/tickets/new"
                            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">New Ticket</span>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-menu"
                        className="flex items-center justify-center p-2 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:border-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5 text-slate-200" />
                        ) : (
                            <Menu className="h-5 w-5 text-slate-200" />
                        )}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div
                    id="mobile-nav-menu"
                    className="lg:hidden border-b border-slate-800 bg-[#0b0f19]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200"
                >
                    <nav className="space-y-1">
                        <Link
                            href="/tickets"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${pathname.startsWith("/tickets") && pathname !== "/tickets/new"
                                ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-semibold"
                                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                }`}
                        >
                            <Inbox className="h-4 w-4 text-slate-400" />
                            <span>Tickets Queue</span>
                        </Link>

                        {isManager && (
                            <Link
                                href="/team"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${pathname.startsWith("/team")
                                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-semibold"
                                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                    }`}
                            >
                                <Users className="h-4 w-4 text-slate-400" />
                                <span>Team Management</span>
                            </Link>
                        )}

                        {isManager && (
                            <Link
                                href="/tickets/new"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${pathname === "/tickets/new"
                                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-semibold"
                                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                    }`}
                            >
                                <Plus className="h-4 w-4 text-slate-400" />
                                <span>Create New Ticket</span>
                            </Link>
                        )}
                    </nav>

                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">
                                        {session.userId}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        Signed in role
                                    </span>
                                </div>
                            </div>
                            <span
                                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isManager
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    }`}
                            >
                                {isManager ? "Manager" : "Agent"}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/20 text-xs font-semibold transition disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                            {loggingOut ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                                    <span>Signing Out...</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

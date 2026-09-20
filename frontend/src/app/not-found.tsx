import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] px-4 text-center">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Page or Ticket Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested resource does not exist or may have been deleted.
      </p>
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}

export default NotFound;

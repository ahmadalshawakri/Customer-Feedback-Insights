import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Sparkles, MessagesSquare } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0b0f19]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="mb-8 text-center space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium tracking-wide mb-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>GenAI Feedback Intelligence</span>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Customer Feedback Insights
          </h1>
        </div>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          AI-assisted triage and actionable categorization for customer support teams
        </p>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-slate-400">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
};

export default LoginPage;

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UserCreateForm } from "@/components/team/UserCreateForm";
import { Users } from "lucide-react";

const TeamPage = async () => {
  const session = await getSession();

  if (!session || session.role !== "support_manager") {
    redirect("/tickets");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage support staff roles and permissions for feedback triage
          </p>
        </div>
      </div>

      <UserCreateForm />
    </div>
  );
};

export default TeamPage;

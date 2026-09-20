import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/context/AuthContext";

const DashboardLayout = async ({ children }: {
  children: React.ReactNode;
}) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <TopNav session={session} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
};

export default DashboardLayout;

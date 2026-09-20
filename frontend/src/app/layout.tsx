import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Customer Feedback Insights",
  description: "AI-assisted customer feedback platform for support managers",
};

const RootLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;

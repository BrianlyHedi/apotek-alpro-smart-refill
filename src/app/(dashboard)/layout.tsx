import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch full profile untuk pass ke komponen layout
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50/50">
      {/* Sidebar (Desktop) + Mobile Nav */}
      <Sidebar role={profile.role} />

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        {/* Navbar */}
        <Navbar user={profile} />

        {/* Main Content Area */}
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}

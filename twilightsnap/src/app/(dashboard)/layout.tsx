import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

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

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import SessionProvider from "@/components/admin/SessionProvider";
import ChatPanel from "@/components/admin/ChatPanel";
import type { UserRole } from "@prisma/client";

export const metadata = {
  title: "Admin | Житлова компанія Progress",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any).role as UserRole ?? "EMPLOYEE";

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar – desktop */}
        <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0">
          <AdminSidebar role={role} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminMobileHeader role={role} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <ChatPanel />
      </div>
    </SessionProvider>
  );
}

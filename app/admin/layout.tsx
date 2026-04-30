import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import SessionProvider from "@/components/admin/SessionProvider";
import ChatPanel from "@/components/admin/ChatPanel";
import NextTopLoader from "nextjs-toploader";
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
      <NextTopLoader color="#D4A017" height={3} showSpinner={false} />
      <div className="flex bg-gray-100 min-h-screen">
        {/* Sidebar – desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
          <AdminSidebar role={role} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminMobileHeader role={role} />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <ChatPanel />
      </div>
    </SessionProvider>
  );
}

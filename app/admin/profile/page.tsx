import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/admin/ProfileEditor";

export const metadata = { title: "Мій профіль | Admin" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true, role: true, telegramChatId: true },
  });

  if (!user) redirect("/auth/signin");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Мій профіль</h1>
      <ProfileEditor user={user} />
    </div>
  );
}

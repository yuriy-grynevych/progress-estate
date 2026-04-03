import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TestimonialsManager from "@/components/admin/TestimonialsManager";

export const metadata = {
  title: "Відгуки | Admin",
};

export default async function TestimonialsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/admin");
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}

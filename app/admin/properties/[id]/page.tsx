import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";
import PropertyAuditLog from "@/components/admin/PropertyAuditLog";
import PropertyOwnerSection from "@/components/admin/PropertyOwnerSection";

export const metadata = {
  title: "Редагування | Admin",
};

export default async function EditPropertyPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as "ADMIN" | "EMPLOYEE" ?? "EMPLOYEE";
  const currentUserId = (session?.user as any)?.id as string;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      ownerContact: { select: { id: true, name: true, phone: true, email: true, notes: true, source: true } },
    },
  });

  if (!property) notFound();

  // Employees can only edit their own properties
  if (role === "EMPLOYEE" && property.assignedUserId !== currentUserId) {
    redirect("/admin/properties");
  }

  const [employees, featureOptions] = await Promise.all([
    role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.feature.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
    <PropertyForm
      initialData={{
        id: property.id,
        titleUk: property.titleUk,
        titleEn: property.titleEn,
        type: property.type,
        listingType: property.listingType,
        status: property.status,
        price: Number(property.price),
        currency: property.currency,
        areaSqm: property.areaSqm,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floor: property.floor,
        totalFloors: property.totalFloors,
        yearBuilt: property.yearBuilt,
        district: property.district ?? "",
        address: property.address ?? "",
        latitude: property.latitude,
        longitude: property.longitude,
        descriptionUk: property.descriptionUk,
        descriptionEn: property.descriptionEn,
        features: property.features,
        isFeatured: property.isFeatured,
        assignedUserId: property.assignedUserId,
        images: property.images.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
        })),
      }}
      employees={employees}
      featureOptions={featureOptions}
      role={role}
      currentUserId={currentUserId}
    />
    {/* Owner section — visible to admin and assigned agent */}
    {(role === "ADMIN" || property.assignedUserId === currentUserId) && (
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <PropertyOwnerSection
          propertyId={property.id}
          currentOwner={property.ownerContact ?? null}
        />
      </div>
    )}
    {role === "ADMIN" && (
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <PropertyAuditLog propertyId={property.id} />
      </div>
    )}
    </div>
  );
}

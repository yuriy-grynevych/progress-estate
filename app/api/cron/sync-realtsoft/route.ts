import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchRealtsoftOffers } from "@/lib/realtsoft";
import { slugify } from "@/lib/utils";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const RS_PREFIX = "rs-";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  const offers = await fetchRealtsoftOffers();
  const feedIds = new Set(offers.map((o) => `${RS_PREFIX}${o.internalId}`));

  for (const offer of offers) {
    const slug = `${RS_PREFIX}${offer.internalId}`;

    const existing = await prisma.property.findUnique({
      where: { slug },
      include: { images: true },
    });

    const data = {
      titleUk: offer.titleUk,
      titleEn: offer.titleUk,
      descriptionUk: offer.descriptionUk,
      descriptionEn: offer.descriptionUk,
      type: offer.propertyType,
      listingType: offer.type,
      status: "ACTIVE" as const,
      price: offer.price,
      currency: offer.currency,
      areaSqm: offer.areaSqm,
      rooms: offer.rooms,
      floor: offer.floor,
      totalFloors: offer.totalFloors,
      city: offer.city,
      district: offer.district,
      address: offer.address,
      latitude: offer.latitude,
      longitude: offer.longitude,
      features: offer.isNewBuilding ? ["new_building"] : [],
      kitchenSqm: offer.kitchenSqm,
    };

    if (!existing) {
      await prisma.property.create({
        data: {
          ...data,
          slug,
          images: {
            create: offer.images.map((url, i) => ({
              url,
              order: i,
              isPrimary: i === 0,
            })),
          },
        },
      });
      created++;
    } else {
      await prisma.property.update({
        where: { slug },
        data,
      });

      // Odśwież zdjęcia tylko jeśli się zmieniły
      const existingUrls = existing.images.map((img) => img.url).sort();
      const newUrls = [...offer.images].sort();
      const imagesChanged = JSON.stringify(existingUrls) !== JSON.stringify(newUrls);

      if (imagesChanged) {
        await prisma.propertyImage.deleteMany({ where: { propertyId: existing.id } });
        await prisma.propertyImage.createMany({
          data: offer.images.map((url, i) => ({
            propertyId: existing.id,
            url,
            order: i,
            isPrimary: i === 0,
          })),
        });
      }

      updated++;
    }
  }

  // Dezaktywuj oferty które zniknęły z feeda
  const toDeactivate = await prisma.property.findMany({
    where: {
      slug: { startsWith: RS_PREFIX },
      status: "ACTIVE",
    },
    select: { slug: true },
  });

  for (const p of toDeactivate) {
    if (!feedIds.has(p.slug)) {
      await prisma.property.update({
        where: { slug: p.slug },
        data: { status: "INACTIVE" },
      });
      deactivated++;
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    deactivated,
    total: offers.length,
    syncedAt: new Date().toISOString(),
  });
}

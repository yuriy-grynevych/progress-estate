import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PHOTO_MAP = {
  "vladgrenevich7@gmail.com":      "/team/hrynevych-vladyslav.jpg",
  "vassilikrislaty1993@gmail.com": "/team/krislatyi-vasyl.jpg",
  "dyuymovochka.if@gmail.com":     "/team/hensitska-khrystyna.jpg",
  "getback1974@gmail.com":         "/team/kniazuk-adrian.jpg",
  "karynahudchakk@gmail.com":      "/team/hudchak-karyna.jpg",
  "bodnarukmaria28@gmail.com":     "/team/bodnaruk-mariia.jpg",
  "galyakarach2@gmail.com":        "/team/petliak-halyna.jpg",
  "nataliapidhirniak@gmail.com":   "/team/melnyk-nataliia.jpg",
  "krystyna.bodnarchuk@gmail.com": "/team/bodnaruk-khrystyna.jpg",
  "maxik20000@gmail.com":          "/team/kuryliak-maksym.jpg",
};

async function main() {
  for (const [email, photoUrl] of Object.entries(PHOTO_MAP)) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { photoUrl },
    });
    console.log(`${result.count ? "✅" : "⚠️ "} ${email} → ${photoUrl}`);
  }
  console.log("\nDone.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

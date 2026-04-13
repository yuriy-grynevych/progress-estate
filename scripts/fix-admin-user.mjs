import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Make Vladyslav the ADMIN
  const vlad = await prisma.user.update({
    where: { email: "vladgrenevich7@gmail.com" },
    data: {
      name: "Владислав Гриневич",
      role: "ADMIN",
    },
  });
  console.log(`✅ Updated: ${vlad.name} (${vlad.email}) → role=${vlad.role}`);

  // 2. Delete the old seed admin account (reassign its properties first)
  const oldAdmin = await prisma.user.findUnique({
    where: { email: "admin@progressestate.com.ua" },
  });

  if (oldAdmin) {
    // Move assigned properties to Vladyslav
    const moved = await prisma.property.updateMany({
      where: { assignedUserId: oldAdmin.id },
      data: { assignedUserId: vlad.id },
    });
    console.log(`  Moved ${moved.count} properties from old admin to Vladyslav`);

    // Move contacts
    const movedContacts = await prisma.contact.updateMany({
      where: { assignedUserId: oldAdmin.id },
      data: { assignedUserId: vlad.id },
    });
    console.log(`  Moved ${movedContacts.count} contacts from old admin to Vladyslav`);

    await prisma.user.delete({ where: { email: "admin@progressestate.com.ua" } });
    console.log(`✅ Deleted old seed admin (admin@progressestate.com.ua)`);
  } else {
    console.log("  Old seed admin not found — nothing to delete");
  }

  console.log("\nDone. Vladyslav Hrynevych is now the only ADMIN.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

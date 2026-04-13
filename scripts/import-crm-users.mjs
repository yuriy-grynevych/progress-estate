/**
 * One-time script: imports CRM employees and assigns them to properties.
 *
 * Run on server:
 *   node scripts/import-crm-users.mjs
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CRM_BASE = "https://crm-progress.realtsoft.net";
const CRM_EMAIL = "vladgrenevich7@gmail.com";
const CRM_PASSWORD = "demo";
const DELAY_MS = 300;
const DEFAULT_PASSWORD = "Progress2024!"; // tymczasowe hasło dla wszystkich

// CRM user IDs discovered from /user page
const CRM_USER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function crmLogin() {
  const loginPage = await fetch(`${CRM_BASE}/login`);
  const html = await loginPage.text();
  const csrfMatch = html.match(/name="_csrf" value="([^"]+)"/);
  if (!csrfMatch) throw new Error("CSRF token not found");
  const csrf = csrfMatch[1];
  const cookies = loginPage.headers.get("set-cookie") ?? "";

  const res = await fetch(`${CRM_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    redirect: "manual",
    body: new URLSearchParams({
      _csrf: csrf,
      "LoginForm[username]": CRM_EMAIL,
      "LoginForm[password]": CRM_PASSWORD,
      "LoginForm[rememberMe]": "0",
    }),
  });

  const rawCookies = [];
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === "set-cookie") rawCookies.push(v.split(";")[0]);
  }
  for (const part of cookies.split(",")) {
    const kv = part.trim().split(";")[0];
    if (kv) rawCookies.push(kv);
  }
  return rawCookies.join("; ");
}

async function fetchUserDetails(cookie, crmId) {
  const res = await fetch(`${CRM_BASE}/user/${crmId}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Name from <h1> or breadcrumb
  const nameMatch =
    html.match(/<h3 class="[^"]*user-name[^"]*">([^<]+)<\/h3>/) ||
    html.match(/class="page-title">([А-ЯІЇЄA-Za-z][^<]{3,60})<\//) ||
    html.match(/data-popup="user"[^>]*>([^<]{5,50})<\/a>/);

  // From the user list page name (already known), or from title
  const titleMatch = html.match(/<title>([^<|]+)/);

  const phones = html.match(/href="tel:([^"]+)"/);
  const emails = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  const photoMatch = html.match(
    /https:\/\/crm-08498194\.s3[^"]+\/progress\/user\/[^"]+\.(jpg|jpeg|png|webp)/i
  );

  // Name from Телефони table context or page title
  const nameFromTitle = titleMatch
    ? titleMatch[1].replace("| RealtSoft CRM", "").trim()
    : null;

  return {
    crmId,
    name: nameFromTitle,
    phone: phones ? phones[1] : null,
    email: emails
      ? emails.find(
          (e) => !e.includes("realtsoft") && !e.includes("example")
        ) ?? null
      : null,
    photoUrl: photoMatch ? photoMatch[0] : null,
  };
}

async function getPropertyAgent(cookie, crmPropertyId) {
  const res = await fetch(`${CRM_BASE}/estate/${crmPropertyId}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Find the responsible participant (icon: fa-user-o font-yellow-lemon = відповідальний)
  const participantMatch = html.match(
    /font-yellow-lemon[^>]*title="Відповідальний"[^>]*><\/i><\/td>\s*<td><a href="\/user\/(\d+)"[^>]*>([^<]+)<\/a>/
  );
  if (participantMatch) {
    return { crmUserId: Number(participantMatch[1]), name: participantMatch[2].trim() };
  }

  // Fallback: any participant row
  const anyParticipant = html.match(
    /participant-user-row[^>]*>[\s\S]{0,200}href="\/user\/(\d+)"[^>]*>([^<]+)<\/a>/
  );
  if (anyParticipant) {
    return { crmUserId: Number(anyParticipant[1]), name: anyParticipant[2].trim() };
  }

  return null;
}

async function main() {
  console.log("=== Import CRM Users & Assign to Properties ===\n");

  console.log("Logging in to CRM...");
  const cookie = await crmLogin();
  console.log("Logged in.\n");

  // ── Step 1: Fetch all user details ──────────────────────────────────────
  console.log("Fetching user details...");
  const crmUsers = [];
  for (const id of CRM_USER_IDS) {
    const user = await fetchUserDetails(cookie, id);
    if (user) {
      crmUsers.push(user);
      console.log(`  CRM user ${id}: ${user.name} | ${user.email} | ${user.phone}`);
    }
    await sleep(DELAY_MS);
  }

  // ── Step 2: Create/update users in DB ───────────────────────────────────
  console.log("\nCreating users in DB...");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Map: crmUserId → DB user
  const crmToDbUser = {};

  for (const u of crmUsers) {
    if (!u.email || !u.name) {
      console.log(`  Skipping CRM ${u.crmId} (${u.name}) — missing email`);
      continue;
    }

    // Normalize email to lower
    const email = u.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Update phone/photo if missing
      const update = {};
      if (!existing.name && u.name)       update.name = u.name;
      if (!existing.phone && u.phone)     update.phone = u.phone;
      if (!existing.photoUrl && u.photoUrl) update.photoUrl = u.photoUrl;

      if (Object.keys(update).length > 0) {
        await prisma.user.update({ where: { email }, data: update });
      }

      console.log(`  [exists] ${u.name} (${email})`);
      crmToDbUser[u.crmId] = existing;
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          name: u.name,
          phone: u.phone ?? null,
          photoUrl: u.photoUrl ?? null,
          role: "EMPLOYEE",
        },
      });
      console.log(`  [created] ${u.name} (${email})`);
      crmToDbUser[u.crmId] = created;
    }
  }

  // ── Step 3: Assign agents to properties ─────────────────────────────────
  console.log("\nAssigning agents to properties...");

  const properties = await prisma.property.findMany({
    where: { slug: { startsWith: "rs-" } },
    select: { id: true, slug: true, assignedUserId: true },
  });

  let assigned = 0;
  let skipped = 0;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const crmId = prop.slug.replace("rs-", "");

    const agent = await getPropertyAgent(cookie, crmId);

    if (!agent) {
      skipped++;
      if (i % 30 === 0) console.log(`  [${i + 1}/${properties.length}] ${prop.slug} — no agent`);
      await sleep(DELAY_MS);
      continue;
    }

    const dbUser = crmToDbUser[agent.crmUserId];
    if (!dbUser) {
      console.log(`  [${i + 1}/${properties.length}] ${prop.slug} — CRM user ${agent.crmUserId} not in DB`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    await prisma.property.update({
      where: { id: prop.id },
      data: { assignedUserId: dbUser.id },
    });

    assigned++;
    if (assigned <= 20 || i % 30 === 0) {
      console.log(`  [${i + 1}/${properties.length}] ${prop.slug} → ${agent.name}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Assigned: ${assigned}, skipped: ${skipped}`);
  console.log(`\nDefault password for all new employees: ${DEFAULT_PASSWORD}`);
  console.log("They can change it in the admin panel under Profile.\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

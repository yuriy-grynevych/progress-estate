/**
 * One-time script: scrapes gas/renovation/wallType from Realtsoft CRM
 * and updates properties table.
 *
 * Run on server:
 *   node scripts/scrape-crm-details.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CRM_BASE = "https://crm-progress.realtsoft.net";
const CRM_EMAIL = "vladgrenevich7@gmail.com";
const CRM_PASSWORD = "demo";
const DELAY_MS = 400; // polite delay between requests

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Login and return cookie string */
async function crmLogin() {
  // Step 1: get CSRF token
  const loginPage = await fetch(`${CRM_BASE}/login`);
  const html = await loginPage.text();
  const csrfMatch = html.match(/name="_csrf" value="([^"]+)"/);
  if (!csrfMatch) throw new Error("CSRF token not found");
  const csrf = csrfMatch[1];
  const cookies = loginPage.headers.get("set-cookie") ?? "";

  // Step 2: POST credentials
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

  // Collect all Set-Cookie headers after redirect
  const rawCookies = [];
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === "set-cookie") rawCookies.push(v.split(";")[0]);
  }
  // Also keep cookies from step 1 (session init)
  for (const part of cookies.split(",")) {
    const kv = part.trim().split(";")[0];
    if (kv) rawCookies.push(kv);
  }

  const cookieHeader = rawCookies.join("; ");
  return cookieHeader;
}

/** Extract a field value from CRM property HTML */
function extractField(html, label) {
  // <tr><th>Газ</th><td>VALUE</td></tr>
  const re = new RegExp(`<th>${label}</th>\\s*<td>([^<]*)</td>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

async function main() {
  console.log("Logging in to CRM...");
  const cookies = await crmLogin();
  console.log("Logged in. Cookie length:", cookies.length);

  // Verify login
  const test = await fetch(`${CRM_BASE}/estate/316`, { headers: { Cookie: cookies } });
  const testHtml = await test.text();
  if (!testHtml.includes("Газ")) {
    console.error("Login check failed — could not find expected fields on estate/316");
    process.exit(1);
  }
  console.log("Login verified.\n");

  // Get all rs- properties
  const properties = await prisma.property.findMany({
    where: { slug: { startsWith: "rs-" } },
    select: { id: true, slug: true },
  });
  console.log(`Found ${properties.length} CRM properties to scrape.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const crmId = prop.slug.replace("rs-", "");

    try {
      const res = await fetch(`${CRM_BASE}/estate/${crmId}`, {
        headers: { Cookie: cookies },
      });

      if (!res.ok) {
        console.log(`[${i + 1}/${properties.length}] ${prop.slug} → HTTP ${res.status}, skipping`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      const html = await res.text();

      const gasType       = extractField(html, "Газ");
      const renovationType = extractField(html, "Ремонт");
      const wallType      = extractField(html, "Тип Стін");

      if (!gasType && !renovationType && !wallType) {
        skipped++;
        if (i % 20 === 0) console.log(`[${i + 1}/${properties.length}] ${prop.slug} — no detail fields`);
        await sleep(DELAY_MS);
        continue;
      }

      await prisma.property.update({
        where: { id: prop.id },
        data: {
          ...(gasType        && { gasType }),
          ...(renovationType && { renovationType }),
          ...(wallType       && { wallType }),
        } as any,
      });

      updated++;
      console.log(
        `[${i + 1}/${properties.length}] ${prop.slug} ✓ газ="${gasType}" ремонт="${renovationType}" стіни="${wallType}"`
      );
    } catch (err) {
      errors++;
      console.error(`[${i + 1}/${properties.length}] ${prop.slug} ERROR:`, err.message);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

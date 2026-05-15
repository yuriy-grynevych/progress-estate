#!/usr/bin/env node
// Telegram long-polling bot — forwards updates to local Next.js API
require("dotenv").config({ path: ".env" });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const API_URL = "http://localhost:3000/api/telegram";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set");
  process.exit(1);
}

let offset = 0;

async function poll() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message","callback_query"]`,
      { signal: AbortSignal.timeout(35000) }
    );
    if (!res.ok) {
      console.error("getUpdates error:", res.status);
      return;
    }
    const data = await res.json();
    if (!data.ok) return;

    for (const update of data.result) {
      offset = update.update_id + 1;
      try {
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-bot-api-secret-token": WEBHOOK_SECRET,
          },
          body: JSON.stringify(update),
        });
      } catch (e) {
        console.error("Failed to forward update:", e.message);
      }
    }
  } catch (e) {
    if (e.name !== "TimeoutError") console.error("Poll error:", e.message);
  }
}

// Remove any existing webhook so polling works
fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
  .then(() => console.log("Webhook cleared, starting polling..."))
  .catch(() => {});

async function loop() {
  while (true) {
    await poll();
  }
}

loop();

// Local polling script — runs instead of webhook for development
// Usage: node scripts/telegram-poll.mjs

const BOT_TOKEN = "8648915613:AAHC7DRudUF88HMcMBxN2LS2Ul45NfuHhLw";
const LOCAL_API = "http://localhost:3001/api/telegram";
const WEBHOOK_SECRET = "PanzerKampfWagen4";

let offset = 0;

async function poll() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
    );
    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram error:", data);
      // If webhook is set, getUpdates won't work — unset it first
      if (data.error_code === 409) {
        console.log("Webhook is active, removing it...");
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
      }
      await sleep(5000);
      return;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;
      console.log(`📨 Message from ${update.message?.from?.first_name}: ${update.message?.text}`);

      // Forward to local Next.js API
      try {
        const apiRes = await fetch(LOCAL_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-bot-api-secret-token": WEBHOOK_SECRET,
          },
          body: JSON.stringify(update),
        });
        const text = await apiRes.text();
        console.log(`   Status: ${apiRes.status}`);
        try {
          console.log("   ✅ API response:", JSON.parse(text));
        } catch {
          console.log("   ⚠️  Raw response:", text.slice(0, 300));
        }
      } catch (err) {
        console.error("   ❌ API error (server not running?):", err.message);
      }
    }
  } catch (err) {
    console.error("Poll error:", err.message);
    await sleep(5000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log("🤖 Telegram polling started... (Ctrl+C to stop)");
console.log(`📡 Forwarding to: ${LOCAL_API}\n`);

while (true) {
  await poll();
}

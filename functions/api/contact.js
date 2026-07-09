// POST /api/contact  — store a contact-form message in Cloudflare D1.
// Place at:  functions/api/contact.js  (Cloudflare Pages Functions)
// Binding required:  env.DB  ->  the meraqi-waitlist D1 database (shared with aionellc.com).
//
// Mirrors aione-web's worker.js contact handler so both sites write to the same
// `messages` table, distinguished by source_site.
//   - D1 is reachable only through this server-side function via the DB binding.
//     The browser never touches the database.
//   - The query is parameterized (.bind), so input cannot be injected.
//   - Honeypot: bots fill the hidden "company" field, humans never see it;
//     those submissions are accepted silently and stored nowhere.
//   - Topic is an enforced enum (TOPICS below), not just a UI dropdown.
//   - Only what is needed to reply is stored: no IP, no user agent,
//     and no console logging of PII.
//   - Methods other than POST get an automatic 405 from Pages Functions.

const TOPICS = new Set([
  "general", "product", "deployment", "sales", "investment",
  "press", "privacy_legal", "security", "fraud_abuse", "complaint",
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot: real users never fill the hidden "company" field; bots do.
  if (body && typeof body.company === "string" && body.company.trim() !== "") {
    return json({ ok: true }, 200); // accept silently, store nothing
  }

  const name = String((body && body.name) || "").trim().slice(0, 120);
  const email = String((body && body.email) || "").trim().toLowerCase();
  const topic = String((body && body.topic) || "").trim();
  const message = String((body && body.message) || "").trim();

  if (email.length < 3 || email.length > 254 || !isEmail(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (!TOPICS.has(topic)) {
    return json({ error: "Pick a topic from the list." }, 400);
  }
  if (message.length < 2 || message.length > 5000) {
    return json({ error: "Write a message (up to 5,000 characters)." }, 400);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO messages (name, email, topic, message, source_site, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(name || null, email, topic, message, "meraqi.ai", new Date().toISOString()).run();
  } catch (e) {
    return json({ error: "Could not send right now. Please email hello@meraqi.ai." }, 500);
  }

  return json({ ok: true }, 200);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

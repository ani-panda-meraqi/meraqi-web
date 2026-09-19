// POST /api/waitlist  — store a beta-waitlist email in Cloudflare D1.
// Place at:  functions/api/waitlist.js  (Cloudflare Pages Functions)
// Binding required:  env.DB  ->  the meraqi-waitlist D1 database.
//
// Security notes:
//   - D1 is reachable only through this server-side function via the DB binding.
//     The browser never touches the database.
//   - The query is parameterized (.bind), so input cannot be injected.
//   - Email is validated, trimmed, lowercased, and length-capped before storage.
//   - The email column is UNIQUE; duplicates are ignored, not errored.
//   - Only email + timestamp + source are stored. No console logging of PII.
//   - Methods other than POST get an automatic 405 from Pages Functions.

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot: real users never fill the hidden field; bots do. Accept silently and store
  // nothing, but do NOT report the row as saved, so the page never shows a confirmation
  // for a record that does not exist. The field is named "hp" because browser autofill
  // fills fields called "company"; "company" is still read for pages cached before the rename.
  const trap = body ? (body.hp ?? body.company) : "";
  if (typeof trap === "string" && trap.trim() !== "") {
    return json({ ok: true }, 200);
  }

  const email = String(body && body.email || "").trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !isEmail(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO waitlist (email, source, created_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(email) DO NOTHING"
    ).bind(email, "meraqi.ai", new Date().toISOString()).run();

    // Read the row back before confirming. The page shows "You're on the list" only when
    // saved is true, so that message always reflects a committed row, whether it was
    // inserted just now or was already there (ON CONFLICT DO NOTHING).
    const row = await env.DB.prepare(
      "SELECT 1 AS present FROM waitlist WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (!row) {
      return json({ error: "Could not save right now. Please try again." }, 500);
    }
  } catch (e) {
    return json({ error: "Could not save right now. Please try again." }, 500);
  }

  return json({ ok: true, saved: true }, 200);
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

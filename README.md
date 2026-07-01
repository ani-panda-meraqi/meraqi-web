# meraqi-web

Static marketing site for **meraqi.ai**, deployed on Cloudflare Pages (git-connected).
Beta signups post to `/api/waitlist`, a Pages Function that writes to a Cloudflare D1
(SQLite) database. The browser never touches the database.

```
index.html                 home page (logo inlined; links to aione-web legal pages)
functions/api/waitlist.js   POST handler: validates + stores the email in D1
schema.sql                  the waitlist table (run once)
wrangler.toml               binds the D1 database to env.DB
```

## One-time setup

1. Install and sign in:
   ```
   npm i -g wrangler
   wrangler login
   ```
2. Create the database, then paste the printed `database_id` into `wrangler.toml`:
   ```
   wrangler d1 create meraqi-waitlist
   ```
3. Create the table (remote):
   ```
   wrangler d1 execute meraqi-waitlist --remote --file=./schema.sql
   ```
4. Commit the filled-in `wrangler.toml` and push.

## Deploy (git-connected)

1. Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect to Git**, pick
   `ani-panda-meraqi/meraqi-web`.
2. Build settings: Framework preset **None**, Build command **(empty)**, Build output
   directory **/**. Save and deploy.
3. Bind D1: project **Settings -> Bindings -> Add -> D1**, variable name `DB`, database
   `meraqi-waitlist`. Redeploy. (If `database_id` is already filled in `wrangler.toml`,
   Pages reads it from there too.)
4. Custom domain: project **Settings -> Custom domains -> Set up**, add `meraqi.ai`.
   DNS is auto-created because the zone is already on Cloudflare.

Pushes to `main` auto-build and deploy.

## Verify

Submit the form on the live site, then read the table:
```
wrangler d1 execute meraqi-waitlist --remote --command "SELECT id, email, created_at FROM waitlist ORDER BY id DESC LIMIT 10;"
```

## Security notes

- D1 is reachable only through the `env.DB` binding inside the Function. No public
  connection string; the browser has no database access.
- The insert is a parameterized prepared statement (`.bind`), so input cannot be injected.
- Email is trimmed, lowercased, length-capped (254), and format-checked server-side.
- `email` is `UNIQUE`; duplicate signups are ignored, not errored.
- A hidden honeypot field is silently dropped. If spam grows, add a free Cloudflare
  Turnstile widget in front of the POST.

## When the app backend is live

D1 is the interim store. Once `app.meraqi.ai` and Postgres are running, export and migrate:
```
wrangler d1 execute meraqi-waitlist --remote --command "SELECT email, created_at FROM waitlist;" --json > waitlist-export.json
```
Then load into the Postgres `waitlist` table (UUIDv7 PK, TIMESTAMPTZ in UTC) per the design
doc, and point the form at the real `/api/waitlist`.

# AFSAHI production handoff

The codebase is prepared for production, but the database security migration and
deployment environment must be applied in the AFSAHI-owned Supabase and hosting
accounts before the site is published.

## 1. Configure Supabase

1. Open the AFSAHI Supabase project.
2. In **SQL Editor**, run the complete file at
   `supabase/migrations/202607160001_secure_reservations.sql`.
3. In **Authentication → Users**, invite or create the owner account with a strong,
   unique password and email confirmation enabled.
4. Run this once in **SQL Editor**, replacing the example email with that exact
   owner email:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, lower(email)
   from auth.users
   where lower(email) = lower('owner@example.com')
   on conflict (user_id) do update set email = excluded.email;
   ```

5. Confirm that **Authentication → URL Configuration → Site URL** is the final
   HTTPS site URL. Add the final URL to the allowed redirect URLs as well.

The migration deliberately allows public visitors to insert a validated `New`
reservation only. Reading, changing, deleting, and dashboard analytics require a
verified Supabase user that is present in `public.admin_users`.

## 2. Configure hosting variables

Set these values in the hosting project for Production and Preview, then redeploy:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_ANON_KEY
VITE_WHATSAPP_NUMBER=212XXXXXXXXX
```

Use only the browser-safe Supabase publishable/anon key. Never add a Supabase
service-role or secret key to a `VITE_` variable.

## 3. Confirm the public URL

The checked-in canonical URL and sitemap use `https://afsahi.vercel.app/`. If the
business uses a custom domain, update the canonical and social URLs in
`index.html` and the URL in `public/sitemap.xml` before publishing.

## 4. Pre-publish checks

Run:

```text
npm ci
npm run check
npm run test:ui
npm run test:perf
```

Finally, submit one test reservation, sign into `/admin`, confirm the request,
change its status, and delete it. This verifies the live Row Level Security rules
and owner allowlist in the real project.

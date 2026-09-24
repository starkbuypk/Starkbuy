🔍 StarkBuy Pakistan — Pre-Deployment Audit
Overall Status
Production Ready: NO — BLOCKED
Overall risk level: HIGH
There are 3 blocking issues (one of which you already know about — the missing products table), plus a client-exposed secret and a CSP rule that will silently break all order emails in production.
🔴 CRITICAL ISSUES (block deployment)
C1 — products table missing from the schema (the PGRST205 you're seeing)
Location: supabase-setup.sql (defines user_roles, orders, coupons, audit_log — no products table); consumers in src/utils/supabaseStore.ts:10-29, src/pages/Admin.tsx:553, src/hooks/useStoreData.ts:9.
Root cause: Code reads/writes supabase.from('products').select('data'), upserts { id, data } on conflict id, orders by created_at — but that table is never created.
Why it matters: The entire storefront and admin product management is non-functional; homepage/collections render empty.
Recommended fix (for the fix phase): Create public.products (id text primary key, data jsonb not null, created_at timestamptz default now()). You must also add RLS — a public SELECT policy (so anonymous shoppers can read) and an admin-only INSERT/UPDATE/DELETE policy that mirrors the orders/coupons pattern. If you enable RLS without a public SELECT policy, products still won't appear; if you skip RLS entirely, anyone can overwrite your catalog.
Blocks deployment: YES.
C2 — Brevo API key shipped to the browser
Location: src/pages/CheckoutPage.tsx:11 — const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY.
Root cause: Any VITE_-prefixed variable is inlined into the public client bundle at build time. The api-key header is sent from the browser (CheckoutPage.tsx:20).
Why it matters: Anyone viewing source or network traffic can extract your Brevo key and send mail from your account (spam/phishing under orders@starkbuypk.com), risking domain reputation and account suspension. This is a genuine secret leak — unlike the Supabase anon key, which is designed to be public.
Recommended fix: Move email sending into a Supabase Edge Function (you already have supabase/functions/server/) and keep the Brevo key in server-side secrets. Note src/assets/* planning docs even state secrets should "never [be] sent to the browser" — the implementation contradicts that.
Blocks deployment: YES (security).
C3 — Content-Security-Policy blocks all order emails in production
Location: public/.htaccess CSP → connect-src 'self' https://*.supabase.co https://api.emailjs.com ...; code calls fetch('https://api.brevo.com/v3/smtp/email') (CheckoutPage.tsx:18).
Root cause: CSP allowlists the old api.emailjs.com but not api.brevo.com. The browser will refuse the request.
Why it matters: In production every owner notification and customer confirmation email is blocked. Worse, the errors are swallowed (catch only logs in DEV — CheckoutPage.tsx:459-460, 477-478), so it fails silently. Works in local dev (no .htaccess), fails on Hostinger.
Recommended fix: If you keep client-side sending, add https://api.brevo.com to connect-src and drop the stale emailjs entries. Better: combine with C2 and send via Edge Function (already same-origin/Supabase).
Blocks deployment: YES (core order flow).
🟠 HIGH ISSUES
H1 — Order totals are computed and submitted entirely client-side
Location: CheckoutPage.tsx:417-496 (all math in browser); orders INSERT policy WITH CHECK (true) (supabase-setup.sql:56-58); supabaseStore.ts:142-145.
Root cause: No server-side price validation. A crafted request can insert any subtotal/total/items, or spam unlimited orders (no rate limiting).
Why it matters: Price/order manipulation and order-table pollution. Impact is reduced because payment is COD (no money captured at checkout), so this is HIGH rather than critical — but it's a real integrity/abuse risk you should acknowledge before launch.
Recommended fix: Validate/recompute totals server-side (Edge Function or DB function) against the products table before insert; consider basic rate limiting.
Blocks deployment: NO (COD mitigates), but strongly recommended.
H2 — Email HTML injection via unescaped customer fields
Location: CheckoutPage.tsx:30-74 — customer_name, shipping_address, item names, etc. are interpolated raw into htmlContent.
Root cause: No HTML escaping of user input before building the email body.
Why it matters: A customer can inject markup/links into the emails you and other customers receive. Your own planning docs call for HTML-escaping all user content — not implemented.
Recommended fix: HTML-escape all interpolated values in ownerEmailHtml/customerEmailHtml.
H3 — Admin-managed content still lives in localStorage (not global)
Location: src/utils/adminStore.ts (categories, hero slides, COD fee, about content); consumed by useStoreData.ts:33-65 and getCodFee() in CheckoutPage.tsx:188, 423.
Root cause: Only products were migrated to Supabase. Categories, slides, COD fee, and about page remain per-browser localStorage.
Why it matters: These admin changes are invisible to other devices/customers, contradicting the "global visibility" goal. Notably the COD fee is per-device, so the checkout total differs between the admin's browser and a customer's.
Recommended fix: Migrate these to Supabase like products (later phase).
🟡 MEDIUM ISSUES
M1 — No error handling around dbSaveOrder. CheckoutPage.tsx:482-500: if the insert throws, the promise rejects, isPlacing stays true (button stuck on "Placing order…"), no toast, and the customer gets no feedback despite possibly having received a confirmation email. Wrap in try/catch with user-facing error.
M2 — Coupon consumed before the order is saved. CheckoutPage.tsx:429-431 increments usage via dbUseCoupon (errors swallowed) before dbSaveOrder. If the order fails, the coupon is still spent. Increment after successful order, server-side.
M3 — Stale CSP entries. script-src still allows https://cdn.emailjs.com and connect-src allows api.emailjs.com, both unused now (Brevo replaced EmailJS). Tighten during the C3 fix.
🟢 LOW ISSUES
L1 — Order-ID entropy. generateOrderId (CheckoutPage.tsx:77-82) uses ~44 bits and truncates; low but nonzero collision risk since it's also the orders primary key.
L2 — Possible setState-after-unmount in useAllProducts (useStoreData.ts:16-31) — async refresh has no unmount guard.
L3 — Hardcoded Supabase URL + anon key fallbacks in src/lib/supabase.ts:3-4. The anon key is safe to expose by design, but committing fallbacks means a missing .env won't fail loudly. Low.
Supabase Audit
Database: Well-structured for orders/coupons/audit. ❌ products table entirely missing (C1).
RLS: ✅ Good on orders (anon insert, admin read/update/delete), coupons (admin-only + public RPCs), audit_log (admin-only). ❌ No policy exists for the (missing) products table.
Auth: ✅ Strong — defense-in-depth: trusted Google OAuth email check plus user_roles DB role check, both required (App.tsx:10-15, AuthContext.tsx:46-63). Route guard returns null while loading (no flash of admin content). Email/password + OAuth both supported.
Coupons: ✅ validate_coupon/use_coupon are SECURITY DEFINER with search_path=public and row-locking (FOR UPDATE) — server-side and atomic. Good.
Storage: No Supabase Storage in use; product images are URLs/localStorage data URIs (see H3 quota note in adminStore.ts:17).
Store Functionality
Products/Cart/Checkout: ❌ Blocked by C1 (no products) and C3 (emails). Cart, coupon, step flow logic otherwise sound.
Orders: ⚠️ Work, but see H1 (client-side totals), M1 (no failure feedback), M2 (coupon consumed early).
Notifications: ❌ Blocked by C3 in production.
Admin: ✅ Auth/guarding solid; product management blocked by C1; slides/categories/COD not global (H3).
Deployment / Hostinger Audit
✅ SPA fallback correctly configured (public/.htaccess rewrites to index.html) — nested-route refresh and 404s handled.
✅ Security headers present (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS) and build artifacts blocked.
✅ TypeScript compiles clean (tsc --noEmit passed).
❌ CSP misconfigured for Brevo (C3).
⚠️ Env config: relies on VITE_ vars; VITE_BREVO_API_KEY must not exist in a client build (C2).
Final Recommendation
🚫 NOT READY — CRITICAL ISSUES FOUND
Three blockers stand between you and a working production store: the missing products table (C1 — the migration you're about to run), the browser-exposed Brevo key (C2), and the CSP that silently kills all order emails on Hostinger (C3). Running the products SQL fixes C1, but C2 and C3 will still break email in production and expose your Brevo account.

I have not changed any code, schema, config, or settings. When you're ready, send the fix-phase instruction and tell me which items to tackle first — I'd suggest C1 → C3 → C2 to get a functioning, email-capable store fastest, then H1/H2.
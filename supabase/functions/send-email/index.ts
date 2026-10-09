import nodemailer from "npm:nodemailer@6";
import { createClient } from "npm:@supabase/supabase-js@2";

// Required secret: SMTP_PASSWORD.
// Optional: SMTP_USER, OWNER_EMAIL, ALLOWED_ORIGINS (comma-separated exact origins).
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "orders@starkbuypk.com";
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") ?? "starkbuypk@gmail.com";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ??
    "https://www.starkbuypk.com,https://starkbuypk.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const CONTACT_SUBJECTS = new Set([
  "Order Inquiry",
  "Exchange / Return",
  "Product Question",
  "Delivery Issue",
  "Other",
]);

function corsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : [...ALLOWED_ORIGINS][0] ?? "https://www.starkbuypk.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req.headers.get("origin")),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function formatMoney(value: unknown): string {
  const amount = Number(value);
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString("en-PK") : "0"}`;
}

type OrderItem = {
  name?: string;
  qty?: number;
  price?: number;
  color?: string;
  caseSize?: string;
  strap?: string;
};

type StoredOrder = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  items: OrderItem[];
  shipping: number;
  total: number;
};

function renderItems(items: OrderItem[]): string {
  return items
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.price) || 0;
      const selections = [item.color, item.caseSize, item.strap]
        .filter(Boolean)
        .map(esc)
        .join(" · ");
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #eee">
          <strong>${esc(item.name)}</strong>
          ${selections ? `<br><span style="color:#777;font-size:12px">${selections}</span>` : ""}
        </td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">${esc(formatMoney(unitPrice * qty))}</td>
      </tr>`;
    })
    .join("");
}

function emailShell(title: string, content: string): string {
  return `<!doctype html>
  <html><body style="margin:0;background:#f7f4ef;font-family:Arial,sans-serif;color:#1a1614">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 14px">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
          <tr><td style="background:#1a1614;padding:24px;text-align:center;color:#C9A84C;font-size:24px;font-weight:700;letter-spacing:3px">STARKBUY</td></tr>
          <tr><td style="padding:28px">
            <h1 style="font-size:22px;margin:0 0 20px">${esc(title)}</h1>
            ${content}
          </td></tr>
          <tr><td style="background:#faf7f4;padding:16px;text-align:center;color:#888;font-size:12px">StarkBuy Pakistan · Cash on Delivery</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function ownerOrderEmail(order: StoredOrder): string {
  return emailShell(
    `New order ${order.id}`,
    `<p><strong>Customer:</strong> ${esc(order.name)}</p>
     <p><strong>Phone:</strong> ${esc(order.phone)}</p>
     <p><strong>Email:</strong> ${esc(order.email || "—")}</p>
     <p><strong>Address:</strong> ${esc(`${order.address}, ${order.city}`)}</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #eee">${renderItems(order.items)}</table>
     <p style="text-align:right"><strong>Shipping:</strong> ${esc(order.shipping === 0 ? "Free" : formatMoney(order.shipping))}</p>
     <p style="text-align:right;font-size:18px;color:#9a7926"><strong>Total: ${esc(formatMoney(order.total))}</strong></p>`,
  );
}

function customerOrderEmail(order: StoredOrder): string {
  return emailShell(
    `Order ${order.id} confirmed`,
    `<p>Thank you, <strong>${esc(order.name.split(" ")[0])}</strong>. Your order has been placed successfully.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #eee">${renderItems(order.items)}</table>
     <p style="text-align:right"><strong>Shipping:</strong> ${esc(order.shipping === 0 ? "Free" : formatMoney(order.shipping))}</p>
     <p style="text-align:right;font-size:18px;color:#9a7926"><strong>Total due: ${esc(formatMoney(order.total))}</strong></p>
     <p style="margin-top:24px">Payment method: <strong>Cash on Delivery</strong></p>
     <p><a href="https://www.starkbuypk.com/track-order" style="color:#9a7926">Track your order</a></p>`,
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response(null, { status: 403, headers });
    }
    return new Response(null, { headers });
  }

  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: "Origin not allowed" }, 403);
  if (!req.headers.get("authorization")?.startsWith("Bearer ")) {
    return json(req, { error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("send-email: required server secrets are missing");
    return json(req, { error: "Email service unavailable" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  async function consumeRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const { data, error } = await admin.rpc("consume_email_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  }

  try {
    const body = await req.json();

    if (body?.type === "newsletter") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!validEmail(email) || email.length > 254) {
        return json(req, { error: "Invalid email address" }, 400);
      }

      const ip = clientIp(req);
      if (!(await consumeRateLimit(`newsletter:ip:${ip}`, 5, 900))) {
        return json(req, { error: "Too many requests" }, 429);
      }

      const { error } = await admin
        .from("newsletter_subscribers")
        .upsert(
          { email, active: true, updated_at: new Date().toISOString() },
          { onConflict: "email" },
        );
      if (error) throw error;

      return json(req, { ok: true });
    }

    if (!smtpPassword) {
      console.error("send-email: SMTP_PASSWORD is missing");
      return json(req, { error: "Email service unavailable" }, 503);
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: smtpPassword },
    });

    if (body?.type === "order_confirmation") {
      const orderId = String(body.orderId ?? "").trim().toUpperCase();
      if (!/^SB-[A-F0-9]{12}$/.test(orderId)) {
        return json(req, { error: "Invalid order ID" }, 400);
      }

      const { data, error } = await admin
        .from("orders")
        .select("id,name,phone,email,address,city,items,shipping,total")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !data) return json(req, { error: "Order not found" }, 404);

      if (!(await consumeRateLimit(`order:${orderId}`, 3, 86400))) {
        return json(req, { error: "Email limit reached" }, 429);
      }

      const order = data as StoredOrder;
      await transporter.sendMail({
        from: `"StarkBuy Orders" <${SMTP_USER}>`,
        to: OWNER_EMAIL,
        subject: `New Order ${order.id} — ${order.name}`,
        html: ownerOrderEmail(order),
      });

      if (order.email && validEmail(order.email)) {
        await transporter.sendMail({
          from: `"StarkBuy Orders" <${SMTP_USER}>`,
          to: order.email,
          subject: `Your StarkBuy Order ${order.id} is Confirmed`,
          html: customerOrderEmail(order),
        });
      }

      return json(req, { ok: true });
    }

    if (body?.type === "contact") {
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const subject = String(body.subject ?? "").trim();
      const message = String(body.message ?? "").trim();

      if (
        name.length < 2 ||
        name.length > 80 ||
        !validEmail(email) ||
        !CONTACT_SUBJECTS.has(subject) ||
        message.length < 5 ||
        message.length > 3000
      ) {
        return json(req, { error: "Invalid contact form" }, 400);
      }

      const ip = clientIp(req);
      const ipAllowed = await consumeRateLimit(`contact:ip:${ip}`, 5, 900);
      const emailAllowed = await consumeRateLimit(
        `contact:email:${email}`,
        3,
        900,
      );
      if (!ipAllowed || !emailAllowed) {
        return json(req, { error: "Too many requests" }, 429);
      }

      await transporter.sendMail({
        from: `"StarkBuy Contact" <${SMTP_USER}>`,
        to: OWNER_EMAIL,
        replyTo: email,
        subject: `[Contact] ${subject}`,
        html: emailShell(
          subject,
          `<p><strong>From:</strong> ${esc(name)} (${esc(email)})</p>
           <p style="white-space:pre-wrap">${esc(message)}</p>`,
        ),
      });
      return json(req, { ok: true });
    }

    return json(req, { error: "Unsupported email event" }, 400);
  } catch (error) {
    console.error("send-email error:", error);
    return json(req, { error: "Unable to send email" }, 500);
  }
});

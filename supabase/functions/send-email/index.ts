// Standalone email function — Figma Make never touches this file
// Deploy: supabase functions deploy send-email --project-ref yfgxtattyuoovrriirtf
// Secret:  supabase secrets set SMTP_PASSWORD="your_password" --project-ref yfgxtattyuoovrriirtf

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { to, subject, html } = await req.json();

    const password = Deno.env.get("SMTP_PASSWORD");
    if (!password) {
      return new Response(JSON.stringify({ error: "SMTP_PASSWORD not set" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const toAddress =
      typeof to === "string"
        ? to
        : Array.isArray(to)
        ? to.join(", ")
        : `${to.name} <${to.email}>`;

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.hostinger.com",
      port: 465,
      username: "orders@starkbuypk.com",
      password,
    });

    await client.send({
      from: "StarkBuy Orders <orders@starkbuypk.com>",
      to: toAddress,
      subject,
      content: " ",
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// Standalone email function — Figma Make never touches this file
// Deploy: supabase functions deploy send-email --project-ref yfgxtattyuoovrriirtf
// Secret:  supabase secrets set SMTP_PASSWORD="your_password" --project-ref yfgxtattyuoovrriirtf

import nodemailer from "npm:nodemailer@6";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
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

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "orders@starkbuypk.com",
        pass: password,
      },
    });

    await transporter.sendMail({
      from: '"StarkBuy Orders" <orders@starkbuypk.com>',
      to: toAddress,
      subject,
      html,
    });

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

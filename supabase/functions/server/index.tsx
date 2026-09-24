import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import nodemailer from "npm:nodemailer";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check
app.get("/make-server-035f7f6f/health", (c) => {
  return c.json({ status: "ok" });
});

// Send email via Hostinger SMTP
app.post("/server/send-order-email", async (c) => {
  try {
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) return c.json({ error: "SMTP_PASSWORD not set" }, 500);

    const { to, subject, html } = await c.req.json();
    if (!to?.email || !subject || !html) return c.json({ error: "Missing fields" }, 400);

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "orders@starkbuypk.com",
        pass: SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Starkbuy Pakistan" <orders@starkbuypk.com>',
      to: to.email,
      subject,
      html,
    });

    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);

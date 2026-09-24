import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-035f7f6f/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/send-order-email", async (c) => {
  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) return c.json({ error: "BREVO_API_KEY not set" }, 500);

    const { to, subject, html } = await c.req.json();
    if (!to?.email || !subject || !html) return c.json({ error: "Missing fields" }, 400);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: "Starkbuy Pakistan", email: "orders@starkbuypk.com" },
        to: [{ email: to.email, name: to.name || to.email }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return c.json({ error: "Brevo error", detail: err }, 502);
    }
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);

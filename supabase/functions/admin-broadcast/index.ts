// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createTransport } from "npm:nodemailer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const env = Deno.env.toObject();
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER2, GMAIL_PASS2 } = env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase service envs" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!GMAIL_USER2 || !GMAIL_PASS2) {
      return new Response(JSON.stringify({ error: "Missing SMTP envs (GMAIL_USER2/GMAIL_PASS2)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { segment, subject, message, batchSize = 300, pauseMs = 20000 } = await req.json();
    if (!segment || !subject || !message) {
      return new Response(JSON.stringify({ error: "segment, subject, message sono obbligatori" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabase.from("profiles").select("email,first_name,bio,vip_status,vip_expiry_date", { count: "exact", head: false });
    const today = new Date();
    const in7 = new Date(today.getTime() + 7*24*60*60*1000);
    const toISO = (d) => d.toISOString().slice(0,10);

    switch (segment) {
      case "VIP_ACTIVE":
        query = query.eq("vip_status", true).or(`vip_expiry_date.is.null,vip_expiry_date.gte.${toISO(today)}`);
        break;
      case "VIP_EXPIRING_7D":
        query = query.eq("vip_status", true).gte("vip_expiry_date", toISO(today)).lte("vip_expiry_date", toISO(in7));
        break;
      case "NO_BIO":
        query = query.or("bio.is.null,bio.eq.");
        break;
      case "NO_NAME":
        query = query.or("first_name.is.null,first_name.eq.,first_name.ilike.Utente");
        break;
      case "ALL_USERS":
      default:
        break;
    }

    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allRecipients = [];
    while (true) {
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      allRecipients = allRecipients.concat((data || []).filter((r) => r.email));
      if (!data || data.length < pageSize) break;
      from += pageSize; to += pageSize;
    }

    const transporter = createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER2, pass: GMAIL_PASS2 },
    });

    let sent = 0, failed = 0, queued = allRecipients.length;
    for (let i = 0; i < allRecipients.length; i += batchSize) {
      const chunk = allRecipients.slice(i, i + batchSize);
      const results = await Promise.all(
        chunk.map(async (r) => {
          const personalizedHTML = (message || "")
            .replace(/\{\{first_name\}\}/g, r.first_name || "Amico")
            .replace(/\{\{vip_expiry_date\}\}/g, r.vip_expiry_date || "");

          try {
            const info = await transporter.sendMail({
              from: `Adult-Meet Notifier <${GMAIL_USER2}>`,
              to: r.email,
              subject,
              html: personalizedHTML.replace(/\n/g, "<br/>"),
            });
            return { ok: true, id: info?.messageId || null };
          } catch (e) {
            console.error("sendMail error", r.email, e?.message);
            return { ok: false, error: e?.message || "send error" };
          }
        })
      );

      results.forEach((r) => (r.ok ? sent++ : failed++));
      if (i + batchSize < allRecipients.length) await sleep(pauseMs);
    }

    return new Response(JSON.stringify({ ok: true, queued, sent, failed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-broadcast error:", err);
    return new Response(JSON.stringify({ error: err?.message || "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase service envs" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { segment } = await req.json();
    if (!segment) {
      return new Response(JSON.stringify({ error: "segment richiesto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let query = supabase.from("profiles").select("id,email,first_name,bio,vip_status,vip_expiry_date", { count: "exact", head: false });
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

    const { data, error, count } = await query.limit(50);
    if (error) throw error;

    return new Response(JSON.stringify({
      ok: true,
      total: count ?? 0,
      sample: (data || []).map((r) => ({ email: r.email, first_name: r.first_name, vip_expiry_date: r.vip_expiry_date })),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("admin-recipients error:", err);
    return new Response(JSON.stringify({ error: err?.message || "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

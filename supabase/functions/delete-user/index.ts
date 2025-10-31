// @ts-nocheck
// Supabase Edge Functions are Deno-based. This function uses `serve` from the standard
// library for broader compatibility and assumes the `Deno` global for environment
// variables is provided by the Supabase runtime environment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// CORS per permettere la chiamata dal browser
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Risposta immediata alle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Client admin con SERVICE_ROLE_KEY (bypassa RLS e può cancellare utenti auth)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,               // es: https://xxxxx.supabase.co
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,  // ⚠️ la service_role, NON la anon key
    {
      global: {
        headers: {
          // molto importante: giro l'Authorization dell’utente che ha chiamato la funzione
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    }
  );

  // Capisco chi è l’utente loggato che sta chiedendo l’eliminazione
  const {
    data: { user },
    error: getUserError,
  } = await supabaseAdmin.auth.getUser();

  if (getUserError || !user) {
    return new Response(
      JSON.stringify({
        error:
          getUserError?.message ??
          "Utente non autenticato o token mancante.",
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  const userId = user.id;

  // Helper per cancellare in sicurezza da una tabella
  // Se passo `orClause`, uso .or() (serve per messages dove posso essere sender o receiver)
  async function safeDelete(
    table: string,
    filter: { column: string; value: string },
    orClause?: string
  ) {
    let q = supabaseAdmin.from(table).delete();

    if (orClause) {
      q = q.or(orClause); // esempio: "sender_id.eq.xxx,receiver_id.eq.xxx"
    } else {
      q = q.eq(filter.column, filter.value);
    }

    const { error } = await q;
    if (error) {
      throw new Error(`[${table}] ${error.message}`);
    }
  }

  try {
    // 1. Chat: elimina tutti i messaggi dove io sono mittente o destinatario
    await safeDelete(
      "messages",
      { column: "sender_id", value: userId },
      `sender_id.eq.${userId},receiver_id.eq.${userId}`
    );

    // 2. Bacheca ospiti / guestbook
    await safeDelete("guestbook_messages", {
      column: "user_id",
      value: userId,
    });

    // 3. Commenti ai check-in
    await safeDelete("comments", {
      column: "user_id",
      value: userId,
    });

    // 4. I miei check-in
    await safeDelete("checkins", {
      column: "user_id",
      value: userId,
    });

    // 5. Se questo utente è/era un locale (club), pulisco eventuali dati del locale
    // Non tutti gli utenti li hanno, quindi se fallisce lo ignoro con catch vuoto
    await safeDelete("events", { column: "venue_id", value: userId }).catch(
      () => {}
    );
    await safeDelete("weekly_schedules", {
      column: "venue_id",
      value: userId,
    }).catch(() => {});
    await safeDelete("venues", { column: "id", value: userId }).catch(() => {});

    // 6. Profilo pubblico
    await safeDelete("profiles", {
      column: "id",
      value: userId,
    });

    // 7. Utente auth vero e proprio (auth.users)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      throw new Error(`[auth] ${deleteAuthError.message}`);
    }

    // Tutto ok
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // Se qualcosa è andato storto in uno degli step sopra
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Errore sconosciuto durante l'eliminazione",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

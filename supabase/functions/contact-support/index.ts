// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createTransport } from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Preflight CORS per le richieste OPTIONS dal browser
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
    const GMAIL_PASS = Deno.env.get("GMAIL_PASS")!;

    if (!GMAIL_USER || !GMAIL_PASS) {
      return new Response(
        JSON.stringify({ error: "Missing email credentials on server." }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Body atteso dal client
    const { email, subject, message } = await req.json();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: "email e message sono obbligatori." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Corpo della mail
    const htmlBody = `
      <p><strong>Da:</strong> ${email}</p>
      <p><strong>Oggetto utente:</strong> ${subject || "(nessun oggetto)"} </p>
      <p><strong>Messaggio:</strong></p>
      <p>${(message || "").replace(/\\n/g, "<br/>")}</p>
    `;

    // Transport Gmail (SMTP via Nodemailer)
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    // Invio email all'amministrazione
    const info = await transporter.sendMail({
      from: `Adult-Meet Notifier <${GMAIL_USER}>`,
      to: "adult.meet.real@gmail.com",
      subject: "Adult-Meet - Nuova Notifica",
      html: htmlBody,
      replyTo: email,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        messageId: info?.messageId || null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("contact-support error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Errore interno in contact-support.",
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

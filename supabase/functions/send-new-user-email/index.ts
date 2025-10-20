// Fix: Declare Deno global for Supabase Edge Function to resolve TypeScript errors.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createTransport } from 'https://deno.land/x/nodemailer@v0.4.0/mod.ts';

// CORS headers for preflight and actual requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Be more specific in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, displayName } = await req.json();

    if (!email || !displayName) {
      return new Response(JSON.stringify({ error: 'Missing email or displayName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // IMPORTANT: These credentials must be set as environment variables (Secrets)
    // in your Supabase project dashboard settings under Edge Functions.
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const adminEmail = Deno.env.get('ADMIN_EMAIL');

    if (!smtpUser || !smtpPass || !adminEmail) {
        console.error('SMTP credentials or admin email not configured in environment variables.');
        // Don't expose this error detail to the client
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"ADULT-MEET Notifiche" <${smtpUser}>`,
      to: adminEmail,
      subject: '🎉 Nuovo Utente Registrato!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #ef4444;">Nuovo Utente su ADULT-MEET</h2>
          <p>Un nuovo utente si è appena registrato sulla piattaforma.</p>
          <p><strong>Nome Visualizzato:</strong> ${displayName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Data Registrazione: ${new Date().toLocaleString('it-IT')}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

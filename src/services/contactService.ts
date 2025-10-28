// services/contactService.ts
// Questa funzione viene chiamata dal ContactModal nel frontend.
// Inoltra i dati alla edge function "contact-support" su Supabase,
// che manda la mail via Gmail SMTP. NIENTE RESEND QUI.

const CONTACT_FUNCTION_URL =
  "https://<PROJECT-REF>.functions.supabase.co/contact-support";
// ^ Sostituisci <PROJECT-REF> con l'URL reale della tua funzione
//   esattamente come te lo dà `supabase functions deploy`
//   Deve finire con `/contact-support`

export async function sendContactMessage({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) {
  const res = await fetch(CONTACT_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      subject,
      message,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Invio fallito: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data;
}

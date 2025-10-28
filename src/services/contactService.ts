// services/contactService.ts
// Invia i dati del form Contatti alla Edge Function "contact-support"
// La Edge Function poi spedisce l'email via Gmail SMTP in modo sicuro.

const CONTACT_FUNCTION_URL =
  "https://seweuyiyvicoqvtgjwss.supabase.co/functions/v1/contact-support";

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
    console.error("Errore invio contatto:", errText);
    throw new Error(`Invio fallito: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data;
}

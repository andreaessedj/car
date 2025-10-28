// services/contactService.ts
// Chiama la Edge Function "contact-support" per inviare la notifica email all'admin.

const CONTACT_FUNCTION_URL = "https://<PROJECT-REF>.functions.supabase.co/contact-support";
// ↑ sostituisci <PROJECT-REF> con quello reale del tuo progetto Supabase dopo il deploy.

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

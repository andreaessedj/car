/**
 * contactService.ts
 * Invia una email all'amministrazione usando Resend.
 *
 * NOTA: questa funzione chiama direttamente l'API Resend dal client.
 * In produzione andrebbe proxata via serverless function per non esporre la key.
 * Qui la usiamo così perché richiesto esplicitamente.
 */

export async function sendContactMessage({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) {
  const RESEND_API_KEY = "re_LwjzF4W3_EXmqCBwsfufB8JjTL4w7fVam";

  const body = {
    from: "noreply@adult-meet.local",
    to: ["adult.meet.real@gmail.com"],
    reply_to: email,
    subject: `[AdultMeet] ${subject || "Nuovo messaggio"}`,
    html: `<p><strong>Da:</strong> ${email}</p>
           <p><strong>Oggetto:</strong> ${subject}</p>
           <p><strong>Messaggio:</strong></p>
           <p>${message.replace(/\n/g, "<br/>")}</p>`,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Invio fallito: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data;
}

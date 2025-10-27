import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Only POST allowed" });
  }

  try {
    const { name, message, user_id } = req.body || {};
    const now = new Date().toISOString();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const subject = `ADULT-MEET: messaggio da ${name ?? "Anonimo"}`;
    const text =
      `Hai ricevuto una nuova notifica dal sito Adult-Meet.\n\n` +
      `Mittente: ${name ?? "Anonimo"}\n` +
      `User ID: ${user_id ?? "(senza id)"}\n` +
      `Messaggio: ${message ?? "(nessun messaggio)"}\n` +
      `Data/Ora: ${now}\n`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.MAIL_TO,
      subject,
      text,
    });

    return res.status(200).json({
      ok: true,
      delivered_to: process.env.MAIL_TO,
      at: now,
    });
  } catch (err) {
    console.error("adultmail-relay ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: String(err),
    });
  }
}
// src/pages/AdminEmail.tsx
import React, { useState } from "react";

type SegmentKey =
  | "ALL_USERS"
  | "VIP_ACTIVE"
  | "VIP_EXPIRING_7D"
  | "NO_BIO"
  | "NO_NAME";

export default function AdminEmailPage() {
  const [segment, setSegment] = useState<SegmentKey>("ALL_USERS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog((prev) => [line, ...prev].slice(0, 200));

  async function handlePreview() {
    setLoading(true);
    setCount(null);
    setLog([]);
    try {
      const res = await fetch("/functions/v1/admin-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      setCount(data?.total ?? 0);
      addLog(`Anteprima: ${data?.total ?? 0} destinatari per il segmento ${segment}.`);
    } catch (e:any) {
      addLog(`Errore anteprima: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!subject || !message) {
      alert("Subject e Message sono obbligatori");
      return;
    }
    setLoading(true);
    setLog([]);
    try {
      const res = await fetch("/functions/v1/admin-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment,
          subject,
          message,
          batchSize: 300,
          pauseMs: 20000,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      addLog(`Invio iniziato: ${data?.queued ?? 0} destinatari in coda.`);
    } catch (e:any) {
      addLog(`Errore invio: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>Admin – Notifiche Email</h1>
      <p style={{ color: "#d97706" }}>
        Modalità senza login attiva (provvisorio). Proteggi l'URL con noindex/nofollow e, se possibile, IP allowlist.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Filtri destinatari</h2>
        <label>
          Segmento:&nbsp;
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as SegmentKey)}
          >
            <option value="ALL_USERS">Tutti gli utenti</option>
            <option value="VIP_ACTIVE">VIP attivi</option>
            <option value="VIP_EXPIRING_7D">VIP in scadenza &lt; 7 giorni</option>
            <option value="NO_BIO">Utenti senza biografia</option>
            <option value="NO_NAME">Utenti senza nome (“Utente”)</option>
          </select>
        </label>
        <div style={{ marginTop: 12 }}>
          <button onClick={handlePreview} disabled={loading}>Anteprima destinatari</button>
          {count !== null && <span style={{ marginLeft: 8 }}>Totale stimato: {count}</span>}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Compositore email</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Subject (obbligatorio)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Message (obbligatorio). Variabili disponibili: {{first_name}}, {{vip_expiry_date}}"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSend} disabled={loading}>Invia ora</button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Log</h2>
        <pre style={{ background: "#111827", color: "white", padding: 12, borderRadius: 6, minHeight: 140 }}>
          {log.join("\n")}
        </pre>
      </section>
    </div>
  );
}

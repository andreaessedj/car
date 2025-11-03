// src/pages/AdminEmail.tsx
import React, { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type SegmentKey =
  | "ALL_USERS"
  | "VIP_ACTIVE"
  | "VIP_EXPIRING_7D"
  | "NO_BIO"
  | "NO_NAME";

// --- Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ACCENT = "#60a5fa";
const ACCENT_2 = "#a78bfa";

// 🎨 Stili vari
const container: React.CSSProperties = {
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
  fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  color: "white",
};
const pageBg: React.CSSProperties = {
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(96,165,250,0.15), transparent 60%), radial-gradient(1200px 800px at 100% 0%, rgba(167,139,250,0.15), transparent 60%), #0b0f19",
  minHeight: "100vh",
};
const h1Style: React.CSSProperties = { fontSize: 28, fontWeight: 700, marginBottom: 6 };
const subStyle: React.CSSProperties = { opacity: 0.8, marginBottom: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 };
const card: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(6px)",
};
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 12 };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" };
const selectStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 12px",
  borderRadius: 10,
};
const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "12px 14px",
  borderRadius: 12,
  width: "100%",
};
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 180 };
const btn: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(96,165,250,0.9), rgba(167,139,250,0.9))",
  border: "none",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
};
const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: `1px solid rgba(255,255,255,0.18)`,
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 600,
};
const chip: React.CSSProperties = {
  background: "rgba(96,165,250,0.12)",
  border: `1px solid rgba(96,165,250,0.35)`,
  color: ACCENT,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};
const helper: React.CSSProperties = { fontSize: 12, opacity: 0.75 };
const logBox: React.CSSProperties = {
  background: "#0a0f1a",
  color: "#e5e7eb",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  minHeight: 140,
  fontFamily: "ui-monospace, Menlo, Consolas",
  fontSize: 12,
  overflow: "auto",
};
const varChip: React.CSSProperties = {
  ...chip,
  background: "rgba(167,139,250,0.12)",
  border: `1px solid rgba(167,139,250,0.35)`,
  color: ACCENT_2,
  cursor: "pointer",
};
const countBadge: React.CSSProperties = {
  ...chip,
  padding: "6px 12px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.35)",
  color: "#34d399",
};
const footerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 8,
};

// 📚 Email predefinite
const templates = [
  {
    key: "welcome",
    label: "Benvenuto su Adult-Meet",
    subject: "🎉 Benvenuto su Adult-Meet! Scopri chi ti sta cercando…",
    message: `Ciao {{first_name}},\n\nBenvenuto nella community più libera e intrigante d’Italia.\nCompleta il tuo profilo con una foto e una descrizione per farti notare 😏\n\n👉 https://adult-meet.vercel.app`,
  },
  {
    key: "no_bio",
    label: "Profilo incompleto (senza bio)",
    subject: "😅 Ti sei dimenticato qualcosa nel profilo?",
    message: `Ciao {{first_name}},\n\nIl tuo profilo è quasi pronto, manca solo la biografia!\nScrivi due righe su di te e vedrai arrivare più messaggi 💌\n👉 https://adult-meet.vercel.app`,
  },
  {
    key: "no_name",
    label: "Nome predefinito (Utente)",
    subject: "🤔 “Utente”? Dai, meriti un nome più intrigante!",
    message: `Ciao {{first_name}},\n\nIl tuo profilo è ancora impostato come “Utente”.\nScegli un nickname unico e fatti notare 😉\n👉 https://adult-meet.vercel.app`,
  },
  {
    key: "vip_offer",
    label: "Invito a diventare VIP",
    subject: "✨ Sblocca tutto il potenziale di Adult-Meet — Passa a VIP",
    message: `Ciao {{first_name}},\n\nCon il VIP ottieni:\n⭐ Profilo in evidenza\n💬 Chat prioritarie\n📍 Visibilità extra\n👉 https://adult-meet.vercel.app/vip`,
  },
  {
    key: "vip_expiring",
    label: "VIP in scadenza (7 giorni)",
    subject: "⚠️ Il tuo abbonamento VIP scadrà presto, {{first_name}}",
    message: `Ciao {{first_name}},\n\nIl tuo abbonamento VIP scade il {{vip_expiry_date}}.\nRinnova subito per non perdere i vantaggi 💎\n👉 https://adult-meet.vercel.app/vip`,
  },
  {
    key: "vip_news",
    label: "Novità per VIP attivi",
    subject: "🔥 Nuova funzione VIP — Scopri chi ti ha messo tra i preferiti!",
    message: `Ciao {{first_name}},\n\nDa oggi i membri VIP possono scoprire chi li ha aggiunti ai preferiti!\n👉 Accedi ora e guarda chi ti ha notato 😉`,
  },
  {
    key: "inactive",
    label: "Utenti inattivi (riattiva interesse)",
    subject: "💤 Ti sei perso qualcosa su Adult-Meet…",
    message: `Ciao {{first_name}},\n\nNuove persone si sono iscritte nella tua zona!\nRientra e scopri chi ti sta cercando 👉 https://adult-meet.vercel.app`,
  },
];

export default function AdminEmailPage() {
  const [segment, setSegment] = useState<SegmentKey>("ALL_USERS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) =>
    setLog((prev) => [new Date().toLocaleTimeString() + "  " + line, ...prev].slice(0, 300));

  const segmentExplainer = useMemo(() => {
    switch (segment) {
      case "VIP_ACTIVE":
        return "Invia ai VIP attivi.";
      case "VIP_EXPIRING_7D":
        return "Invia ai VIP con scadenza entro 7 giorni.";
      case "NO_BIO":
        return "Invia a chi non ha completato la biografia.";
      case "NO_NAME":
        return 'Invia a chi ha ancora il nome predefinito "Utente".';
      default:
        return "Invia a tutti gli utenti.";
    }
  }, [segment]);

  async function handlePreview() {
    setLoading(true);
    setCount(null);
    setLog([]);
    try {
      const { data, error } = await supabase.functions.invoke("admin-recipients", { body: { segment } });
      if (error) throw error;
      const total = data?.total ?? 0;
      setCount(total);
      addLog(`Anteprima: ${total} destinatari per il segmento ${segment}.`);
    } catch (e: any) {
      addLog(`Errore anteprima: ${e.message ?? e.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      alert("Subject e Message sono obbligatori");
      return;
    }
    setLoading(true);
    setLog([]);
    try {
      const { data, error } = await supabase.functions.invoke("admin-broadcast", {
        body: { segment, subject, message },
      });
      if (error) throw error;
      addLog(`Invio accodato: ${data?.queued ?? 0} destinatari.`);
    } catch (e: any) {
      addLog(`Errore invio: ${e.message ?? e.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  function insertVar(token: string) {
    setMessage((m) => (m && !m.endsWith(" ") ? m + " " : m) + token);
  }

  return (
    <div style={pageBg}>
      <div style={container}>
        <h1 style={h1Style}>Admin • Notifiche Email</h1>
        <div style={subStyle}>
          <span style={{ ...chip, marginRight: 8 }}>Edge Functions</span>
          <span style={{ ...chip, borderColor: "rgba(255,255,255,0.25)", color: "#cbd5e1" }}>CORS OK</span>
        </div>

        <div style={grid}>
          <div style={{ display: "grid", gap: 16 }}>
            {/* --- Filtri --- */}
            <div style={card}>
              <div style={sectionTitle}>Filtri destinatari</div>
              <div style={row}>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SegmentKey)}
                  style={{ ...selectStyle, marginTop: 6 }}
                  disabled={loading}
                >
                  <option value="ALL_USERS">Tutti gli utenti</option>
                  <option value="VIP_ACTIVE">VIP attivi</option>
                  <option value="VIP_EXPIRING_7D">VIP in scadenza &lt; 7 giorni</option>
                  <option value="NO_BIO">Senza biografia</option>
                  <option value="NO_NAME">Nome predefinito</option>
                </select>
                <button onClick={handlePreview} style={btn} disabled={loading}>
                  {loading ? "Carico..." : "Anteprima"}
                </button>
                {count !== null && <span style={countBadge}>Totale: {count}</span>}
              </div>
              <div style={{ ...helper, marginTop: 10 }}>{segmentExplainer}</div>
            </div>

            {/* --- Composer --- */}
            <div style={card}>
              <div style={sectionTitle}>Compositore email</div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, opacity: 0.85 }}>Scegli modello pronto</label>
                <select
                  onChange={(e) => {
                    const preset = templates.find((x) => x.key === e.target.value);
                    if (preset) {
                      setSubject(preset.subject);
                      setMessage(preset.message);
                    }
                  }}
                  defaultValue=""
                  style={{ ...selectStyle, marginTop: 6, width: "100%" }}
                >
                  <option value="">-- Seleziona un modello --</option>
                  {templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <input
                style={{ ...inputStyle, marginBottom: 10 }}
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                style={textareaStyle}
                placeholder="Message ({{first_name}}, {{vip_expiry_date}} disponibili)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={footerRow}>
                <div style={row}>
                  <span style={varChip} onClick={() => insertVar("{{first_name}}")}>
                    {"{{first_name}}"}
                  </span>
                  <span style={varChip} onClick={() => insertVar("{{vip_expiry_date}}")}>
                    {"{{vip_expiry_date}}"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button onClick={handleSend} style={btn} disabled={loading}>
                  {loading ? "Invio..." : "Invia ora"}
                </button>
                <button
                  onClick={() => {
                    setSubject("");
                    setMessage("");
                    setCount(null);
                    setLog([]);
                  }}
                  style={btnGhost}
                >
                  Pulisci
                </button>
              </div>
            </div>
          </div>

          {/* --- Log --- */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <div style={sectionTitle}>Log</div>
              <pre style={logBox}>{log.join("\n") || "Nessun log ancora."}</pre>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, opacity: 0.6, fontSize: 12 }}>
          ADULT-MEET • Admin Mail Console
        </div>
      </div>
    </div>
  );
}

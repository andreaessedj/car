// src/pages/AdminEmail.tsx
import React, { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type SegmentKey =
  | "ALL_USERS"
  | "VIP_ACTIVE"
  | "VIP_EXPIRING_7D"
  | "NO_BIO"
  | "NO_NAME";

// --- Supabase client (se ne hai già uno centralizzato, importalo e rimuovi queste 3 righe)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ACCENT = "#60a5fa"; // blu acceso
const ACCENT_2 = "#a78bfa"; // viola acceso

const container: React.CSSProperties = {
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
  fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  color: "white",
};

const pageBg: React.CSSProperties = {
  // sfondo dark con leggero gradiente futuristico
  background:
    "radial-gradient(1200px 600px at 20% -10%, rgba(96,165,250,0.15), transparent 60%), radial-gradient(1200px 800px at 100% 0%, rgba(167,139,250,0.15), transparent 60%), #0b0f19",
  minHeight: "100vh",
};

const h1Style: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: 0.2,
  marginBottom: 6,
};

const subStyle: React.CSSProperties = {
  opacity: 0.8,
  marginBottom: 20,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: 16,
};

const card: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(6px)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
  letterSpacing: 0.3,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const selectStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 12px",
  borderRadius: 10,
  outline: "none",
};

const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "12px 14px",
  borderRadius: 12,
  outline: "none",
  width: "100%",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: 180,
};

const btn: React.CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(96,165,250,0.9), rgba(167,139,250,0.9))",
  border: "none",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  letterSpacing: 0.3,
  boxShadow: "0 10px 20px rgba(96,165,250,0.25)",
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

const helper: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
};

const logBox: React.CSSProperties = {
  background: "#0a0f1a",
  color: "#e5e7eb",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  minHeight: 140,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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

export default function AdminEmailPage() {
  const [segment, setSegment] = useState<SegmentKey>("ALL_USERS");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) =>
    setLog((prev) => [new Date().toLocaleTimeString() + "  " + line, ...prev].slice(0, 300));

  const subjectLen = subject.length;
  const messageLen = message.length;

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

  function insertVar(token: string) {
    setMessage((m) => {
      const sep = m && !m.endsWith(" ") ? " " : "";
      return m + sep + token;
    });
  }

  async function handlePreview() {
    setLoading(true);
    setCount(null);
    setLog([]);
    try {
      const { data, error } = await supabase.functions.invoke("admin-recipients", {
        body: { segment },
      });
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
        body: {
          segment,
          subject,
          message,
          // Puoi regolare batchSize/pauseMs anche lato funzione per sicurezza
          batchSize: 300,
          pauseMs: 20000,
        },
      });
      if (error) throw error;
      addLog(`Invio accodato: ${data?.queued ?? 0} destinatari.`);
    } catch (e: any) {
      addLog(`Errore invio: ${e.message ?? e.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageBg}>
      <div style={container}>
        <h1 style={h1Style}>Admin • Notifiche Email</h1>
        <div style={subStyle}>
          <span style={{ ...chip, marginRight: 8 }}>Edge Functions</span>
          <span style={{ ...chip, borderColor: "rgba(255,255,255,0.25)", color: "#cbd5e1" }}>
            CORS OK via Supabase SDK
          </span>
        </div>

        <div style={grid}>
          {/* Colonna sinistra: Filtri + Composer */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <div style={sectionTitle}>Filtri destinatari</div>
              <div style={row}>
                <label style={{ fontSize: 13, opacity: 0.85 }}>
                  Segmento
                  <br />
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as SegmentKey)}
                    style={{ ...selectStyle, marginTop: 6 }}
                    disabled={loading}
                  >
                    <option value="ALL_USERS">Tutti gli utenti</option>
                    <option value="VIP_ACTIVE">VIP attivi</option>
                    <option value="VIP_EXPIRING_7D">VIP in scadenza &lt; 7 giorni</option>
                    <option value="NO_BIO">Utenti senza biografia</option>
                    <option value="NO_NAME">Utenti senza nome (“Utente”)</option>
                  </select>
                </label>

                <button onClick={handlePreview} style={btn} disabled={loading}>
                  {loading ? "Carico..." : "Anteprima destinatari"}
                </button>

                {count !== null && (
                  <span style={countBadge}>Totale: {count}</span>
                )}
              </div>
              <div style={{ ...helper, marginTop: 10 }}>{segmentExplainer}</div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Compositore email</div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, opacity: 0.85 }}>Oggetto</label>
                <input
                  style={{ ...inputStyle, marginTop: 6 }}
                  placeholder="Subject (obbligatorio)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                />
                <div style={footerRow}>
                  <span style={helper}>Lunghezza oggetto: {subjectLen} caratteri</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, opacity: 0.85 }}>Messaggio</label>
                <textarea
                  style={{ ...textareaStyle, marginTop: 6 }}
                  placeholder="Message (obbligatorio). Variabili: {{first_name}}, {{vip_expiry_date}}"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={12}
                  disabled={loading}
                />
                <div style={footerRow}>
                  <div style={row}>
                    <span style={{ ...helper, marginRight: 8 }}>Inserisci variabili:</span>
                    <span style={varChip} onClick={() => insertVar("{{first_name}}")}>
                      {"{{first_name}}"}
                    </span>
                    <span style={varChip} onClick={() => insertVar("{{vip_expiry_date}}")}>
                      {"{{vip_expiry_date}}"}
                    </span>
                  </div>
                  <span style={helper}>Lunghezza messaggio: {messageLen} caratteri</span>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={handleSend} style={btn} disabled={loading}>
                    {loading ? "Invio..." : "Invia adesso"}
                  </button>
                  <button
                    onClick={() => {
                      setSubject("");
                      setMessage("");
                      setCount(null);
                      setLog([]);
                    }}
                    style={btnGhost}
                    disabled={loading}
                  >
                    Pulisci
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colonna destra: Log */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card}>
              <div style={sectionTitle}>Log</div>
              <pre style={logBox}>{log.join("\n") || "Nessun log ancora."}</pre>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  style={btnGhost}
                  onClick={() => setLog([])}
                  disabled={loading || log.length === 0}
                >
                  Svuota log
                </button>
                <button
                  style={btnGhost}
                  onClick={() => navigator.clipboard.writeText(log.join("\n"))}
                  disabled={log.length === 0}
                >
                  Copia log
                </button>
              </div>
              <div style={{ ...helper, marginTop: 12 }}>
                Suggerimento: se vuoi un “dry-run” lato funzione, supporta un flag (es. <code>test: true</code>) e non inviare realmente le email.
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Note sicurezza</div>
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.85 }}>
                <li>Permetti l’accesso solo ad admin autenticati (policy lato funzione).</li>
                <li>Valida i campi lato server (subject/message/segment).</li>
                <li>Rate limit & logging lato funzione per audit.</li>
              </ul>
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

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./hooks/useAuth";

console.log("[BOOT] mount index.tsx");

// Attendi che il DOM sia pronto
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("❌ Nessun elemento #root trovato");
    return;
  }

  // Previene montaggi multipli o errori #130
  if (!rootElement.hasAttribute("data-reactroot")) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <I18nProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </I18nProvider>
        </React.StrictMode>
      );
      console.log("✅ React montato correttamente");
    } catch (err) {
      console.error("❌ Errore durante il mount React:", err);
    }
  }
});

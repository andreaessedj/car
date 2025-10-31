import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./hooks/useAuth";

// Fix: compatibilità garantita tra React 18+ e importmap custom
console.log("[BOOT] mount index.tsx");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found in index.html");
}

// Evita doppio montaggio o errori di re-render
if (!rootElement.hasAttribute("data-reactroot")) {
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
}

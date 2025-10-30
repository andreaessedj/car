import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './hooks/useAuth';

// 🔒 Error Boundary globale (cattura errori silenti che bloccano il render)
function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  const [err, setErr] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      console.error('[global onerror]', ev.error || ev.message);
    };
    const onRej = (ev: PromiseRejectionEvent) => {
      console.error('[global unhandledrejection]', ev.reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  if (err) {
    return (
      <div
        style={{
          color: '#fff',
          background: '#111',
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        <div>
          <h1>Si è verificato un errore</h1>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {String(err?.stack || err?.message)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <React.ErrorBoundary
      fallbackRender={({ error }) => {
        console.error('[ErrorBoundary]', error);
        setErr(error as Error);
        return null;
      }}
    >
      {children}
    </React.ErrorBoundary>
  );
}

console.log('[BOOT] mount index.tsx');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);

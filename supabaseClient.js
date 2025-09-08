
// supabaseClient.js
// Inizializza il client Supabase usando variabili globali impostate in index.html
// (window.SUPABASE_URL e window.SUPABASE_ANON_KEY)

window.sb = window.sb || {};
(function(){
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Config mancante: imposta SUPABASE_URL e SUPABASE_ANON_KEY in index.html');
  }
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
  window.sb.client = supabase;
})();

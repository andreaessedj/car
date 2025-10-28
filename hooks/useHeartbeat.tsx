import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

/**
 * useHeartbeat
 *
 * Aggiorna `profiles.last_active` ogni ~60s per l'utente loggato.
 * Monta questo hook in un componente che è renderizzato solo dopo login
 * (es. layout protetto, dashboard, ecc.).
 */
export function useHeartbeat() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let userId: string | null = null;

    async function init() {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || null;
      if (!userId || cancelled) return;

      // funzione che manda il ping
      const beat = async () => {
        if (!userId) return;
        await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userId);
      };

      // ping immediato
      beat();

      // ping ricorrente
      intervalRef.current = window.setInterval(() => {
        beat();
      }, 60_000);
    }

    init();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

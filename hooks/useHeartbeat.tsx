import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

/**
 * useHeartbeat
 *
 * Aggiorna il campo `last_active` nella tabella `profiles`
 * ogni ~60 secondi per l'utente autenticato.
 *
 * Monta questo hook in un componente che viene renderizzato
 * solo quando l'utente è loggato (es Dashboard / Layout protetto).
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

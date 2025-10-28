/**
 * getOnlineStatus
 *
 * Calcola lo stato online dell'utente partendo dal timestamp last_active.
 * Regola base:
 *  - Online se last_active <= 2 minuti fa
 *  - Altrimenti mostra "Ultimo accesso X minuti fa"
 */
export function getOnlineStatus(lastActive?: string | null) {
  if (!lastActive) {
    return {
      label: 'Offline',
      online: false,
      minutesAgo: null,
    };
  }

  const last = new Date(lastActive).getTime();
  const now = Date.now();
  const diffMs = now - last;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin <= 2) {
    return {
      label: 'Online',
      online: true,
      minutesAgo: diffMin,
    };
  }

  if (diffMin === 0) {
    return {
      label: 'Attivo ora',
      online: false,
      minutesAgo: 0,
    };
  }

  if (diffMin === 1) {
    return {
      label: 'Ultimo accesso 1 minuto fa',
      online: false,
      minutesAgo: 1,
    };
  }

  return {
    label: `Ultimo accesso ${diffMin} minuti fa`,
    online: false,
    minutesAgo: diffMin,
  };
}

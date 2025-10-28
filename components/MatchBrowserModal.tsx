import React, { useEffect, useState } from 'react';
import { fetchMatchCandidates } from '../services/matchService';
import { handleLike } from '../services/likeService';
import { useAuth } from '../hooks/useAuth';
import { getOnlineStatus } from '../utils/getOnlineStatus';
import { StatusChip } from './StatusChip';

interface MatchBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MatchBrowserModal
 *
 * Mostra una griglia di profili suggeriti in base a:
 *  - looking_for_gender dell'utente loggato
 *  - solo profili con avatar
 *  - esclusi i locali/club
 *
 * Da agganciare a un bottone "Match" nell'header.
 */
const MatchBrowserModal: React.FC<MatchBrowserModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      setLoading(true);
      const list = await fetchMatchCandidates(user.id);
      setCandidates(list);
      setLoading(false);
    })();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* pannello laterale tipo Dashboard */}
      <div className="fixed top-0 right-0 h-full bg-gray-800 w-full max-w-lg z-50 p-4 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Match</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            Chiudi
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Caricamento…</p>
        ) : candidates.length === 0 ? (
          <p className="text-gray-500 italic">
            Nessun profilo trovato con questi filtri
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {candidates.map(person => {
              const status = getOnlineStatus(person.last_active);

              return (
                <div
                  key={person.id}
                  className="bg-gray-700 rounded-md p-3 flex flex-col"
                >
                  {/* immagine profilo */}
                  <div className="relative w-full pb-[100%] rounded-md overflow-hidden bg-gray-600">
                    {person.avatar_url && (
                      <img
                        src={person.avatar_url}
                        alt={person.display_name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* info utente + stato online */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col max-w-[70%]">
                      <span className="text-white font-semibold text-sm truncate">
                        {person.display_name}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {person.bio || '—'}
                      </span>
                    </div>
                    <StatusChip
                      label={status.label}
                      online={status.online}
                    />
                  </div>

                  {/* bottone like */}
                  <button
                    onClick={async () => {
                      if (!user) return;
                      await handleLike(user.id, person.id);
                    }}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded-md"
                  >
                    ❤️ Mi interessa
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MatchBrowserModal;

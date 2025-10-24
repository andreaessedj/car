
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { ShieldExclamationIcon } from './icons';

interface DeleteAccountModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose, onConfirm }) => {
    const { user, profile, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'ELIMINA') {
            toast.error("Digita 'ELIMINA' per confermare.");
            return;
        }
        if (!user) {
            toast.error("Utente non trovato.");
            return;
        }

        setLoading(true);
        
        // Workaround for potential missing cascade deletes on backend for club accounts
        if (profile?.profile_type === 'club') {
            const { error: eventsError } = await supabase.from('events').delete().eq('venue_id', user.id);
            if (eventsError) {
                toast.error(`Errore durante l'eliminazione degli eventi: ${eventsError.message}`);
                setLoading(false);
                return;
            }
            const { error: schedulesError } = await supabase.from('weekly_schedules').delete().eq('venue_id', user.id);
            if (schedulesError) {
                toast.error(`Errore durante l'eliminazione delle programmazioni: ${schedulesError.message}`);
                setLoading(false);
                return;
            }
        }
        
        // Supabase Edge Functions are the secure way to delete users.
        const { error } = await supabase.functions.invoke('delete-user', {
            body: {}, // The function will get the user from the auth token
        });

        if (error) {
            toast.error(`Errore: ${error.message}`);
            setLoading(false);
        } else {
            toast.success("Account eliminato con successo.");
            // Sign out to clear local session
            await signOut();
            onConfirm();
            // Force a reload to reset the app state
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="text-center">
                    <ShieldExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Sei sicuro?</h2>
                    <p className="text-gray-300 mt-2">
                        Questa azione è irreversibile. Tutti i tuoi dati, inclusi profilo, check-in, commenti e messaggi, verranno eliminati definitivamente.
                    </p>
                </div>
                
                <div className="my-4">
                    <label className="text-sm text-gray-400">
                        Per confermare, digita <strong className="text-white">ELIMINA</strong> qui sotto:
                    </label>
                    <input 
                        type="text" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1 text-center"
                    />
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                        Annulla
                    </button>
                    <button 
                        onClick={handleDelete} 
                        disabled={loading || confirmText !== 'ELIMINA'}
                        className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md disabled:bg-red-900 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Eliminazione...' : 'Elimina Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;

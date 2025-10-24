
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import type { Profile, Message } from '../types';
import { XMarkIcon, UserCircleIcon, PaperAirplaneIcon } from './icons';
import { useTranslation } from '../i18n';
import DeleteAccountModal from './DeleteAccountModal';
import ChatView from './ChatView';

interface DashboardModalProps {
    onClose: () => void;
    initialRecipient?: Profile | null;
}

type Tab = 'profile' | 'messages';

const DashboardModal: React.FC<DashboardModalProps> = ({ onClose, initialRecipient }) => {
    const { t } = useTranslation();
    const { user, profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>(initialRecipient ? 'messages' : 'profile');
    
    // Profile state
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [gender, setGender] = useState(profile?.gender || '');
    const [status, setStatus] = useState<'Single' | 'Coppia' | null>(profile?.status || 'Single');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const [loading, setLoading] = useState(false);

    // Messages state
    const [conversations, setConversations] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<Profile | null>(initialRecipient || null);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (activeTab === 'messages' && user && !selectedConversation) {
            const fetchConversations = async () => {
                setLoadingMessages(true);
                const { data, error } = await supabase
                    .from('messages')
                    .select('*, sender:sender_id(*), receiver:receiver_id(*)')
                    .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
                    .order('created_at', { ascending: false });

                if (error) {
                    toast.error(error.message);
                } else {
                    const convMap = new Map<string, Message>();
                    data?.forEach(msg => {
                        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                        if (!convMap.has(otherUserId) || new Date(msg.created_at!) > new Date(convMap.get(otherUserId)!.created_at!)) {
                            convMap.set(otherUserId, msg);
                        }
                    });
                    setConversations(Array.from(convMap.values()));
                }
                setLoadingMessages(false);
            };
            fetchConversations();
        }
    }, [activeTab, user, selectedConversation]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;
        setLoading(true);

        let avatar_url = profile.avatar_url;
        if (avatarFile) {
            const filePath = `public/${user.id}/${Date.now()}-${avatarFile.name}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
            if (uploadError) {
                toast.error(uploadError.message);
                setLoading(false);
                return;
            }
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatar_url = data.publicUrl;
        }

        const { error } = await supabase.from('profiles').update({
            display_name: displayName,
            bio,
            gender,
            status,
            avatar_url,
        }).eq('id', user.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Profilo aggiornato!");
            await refreshProfile();
        }
        setLoading(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSelectConversation = (recipient: Profile) => {
        setSelectedConversation(recipient);
    };

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                {!(activeTab === 'messages' && selectedConversation) && (
                    <div className="p-4 border-b border-gray-700 flex-shrink-0">
                        <div className="flex">
                            <button onClick={() => { setActiveTab('profile'); setSelectedConversation(null); }} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'profile' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>Profilo</button>
                            <button onClick={() => { setActiveTab('messages'); setSelectedConversation(null); }} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'messages' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>Messaggi</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'profile' && profile && (
                        <div className="p-6">
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="h-20 w-20 text-gray-500" />
                                    )}
                                    <div>
                                        <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-md">
                                            Cambia Foto
                                        </label>
                                        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Nome Visualizzato</label>
                                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Bio</label>
                                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded-md" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Genere</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                                            <option value="">Seleziona...</option>
                                            <option value="M">Uomo</option>
                                            <option value="F">Donna</option>
                                            <option value="Trav">Trav</option>
                                            <option value="Trans">Trans</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Stato</label>
                                        <select value={status || 'Single'} onChange={e => setStatus(e.target.value as 'Single' | 'Coppia')} className="w-full bg-gray-700 p-2 rounded-md">
                                            <option value="Single">Single</option>
                                            <option value="Coppia">Coppia</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500">
                                    {loading ? "Salvataggio..." : "Salva Modifiche"}
                                </button>
                                <div className="pt-4 mt-4 border-t border-gray-700 text-center">
                                    <h3 className="font-semibold text-red-500">Zona Pericolosa</h3>
                                    <p className="text-xs text-gray-400 mb-2">Questa azione è permanente.</p>
                                    <button type="button" onClick={() => setShowDeleteModal(true)} className="text-sm text-red-500 hover:underline bg-red-900/50 px-3 py-1 rounded-md">
                                        Elimina il mio account
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {activeTab === 'messages' && (
                        <div className="h-full">
                            {selectedConversation ? (
                                <ChatView recipient={selectedConversation} onBack={() => setSelectedConversation(null)} />
                            ) : (
                                <div className="p-6">
                                    {loadingMessages ? <p>Caricamento messaggi...</p> : (
                                        <ul className="space-y-3">
                                            {conversations.length > 0 ? conversations.map(msg => {
                                                const otherUser = msg.sender_id === user?.id ? msg.receiver : msg.sender;
                                                if (!otherUser) return null;
                                                return (
                                                    <li key={msg.id} onClick={() => handleSelectConversation(otherUser)} className="bg-gray-700 p-3 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-600 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {otherUser.avatar_url ? (
                                                                <img src={otherUser.avatar_url} alt={otherUser.display_name} className="h-10 w-10 rounded-full object-cover flex-shrink-0"/>
                                                            ) : (
                                                                <UserCircleIcon className="h-10 w-10 text-gray-500 flex-shrink-0"/>
                                                            )}
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="font-semibold truncate">{otherUser.display_name}</p>
                                                                <p className="text-sm text-gray-400 truncate">{msg.content}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                            {new Date(msg.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </li>
                                                )
                                            }) : <p>Nessun messaggio.</p>}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} onConfirm={onClose} />}
        </>
    );
};

export default DashboardModal;

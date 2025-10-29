import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import type { Profile, Message } from '../types';
import { 
    XMarkIcon,
    UserCircleIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    ChatBubbleOvalLeftEllipsisIcon
} from './icons';
import { useTranslation } from '../i18n';
import DeleteAccountModal from './DeleteAccountModal';
import ChatView from './ChatView';
import VisitorsTab from './src/VisitorsTab';
import LikesReceivedTab from '.src/LikesReceivedTab';
import { isVipActive } from '../utils/vip';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DashboardPanelProps {
    isOpen: boolean;
    onClose: () => void;
    initialRecipient?: Profile | null;
    presenceChannel: RealtimeChannel | null;
    onlineUsers: any[];
}

type Tab = 'profile' | 'messages' | 'visitors' | 'likes';

const DashboardPanel: React.FC<DashboardPanelProps> = ({
    isOpen,
    onClose,
    initialRecipient,
    presenceChannel,
    onlineUsers
}) => {
    const { t } = useTranslation();
    const { user, profile, refreshProfile } = useAuth();

    // quale tab è attiva
    const [activeTab, setActiveTab] = useState<Tab>(
        initialRecipient ? 'messages' : 'profile'
    );

    // stato campi profilo
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [gender, setGender] = useState(profile?.gender || '');
    const [status, setStatus] = useState<'Single' | 'Coppia' | null>(profile?.status || 'Single');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const [loading, setLoading] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    // stato messaggi/conversazioni
    const [conversations, setConversations] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<Profile | null>(null);
    const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());

    // modal elimina account
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const vip = isVipActive(profile);

    // sync dati profilo nel form quando cambia "profile"
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setGender(profile.gender || '');
            setStatus(profile.status || 'Single');
            setAvatarPreview(profile.avatar_url || null);
        }
    }, [profile]);

    // se ho initialRecipient apro direttamente quella conversazione
    useEffect(() => {
        if (initialRecipient) {
            setSelectedConversation(initialRecipient);
            setActiveTab('messages');
        } else {
            setSelectedConversation(null);
        }
    }, [initialRecipient]);

    // quando chiudi il pannello resetta
    useEffect(() => {
        if (!isOpen) {
            if (!initialRecipient) {
                setSelectedConversation(null);
                setActiveTab('profile');
            }
        }
    }, [isOpen, initialRecipient]);

    // carica conversazioni
    const fetchConversations = async () => {
        if (!user) return;
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
            const unread = new Set<string>();

            data?.forEach(msg => {
                const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

                // tieni l'ultimo messaggio con quell'utente
                if (
                    !convMap.has(otherUserId) ||
                    new Date(msg.created_at!) > new Date(convMap.get(otherUserId)!.created_at!)
                ) {
                    convMap.set(otherUserId, msg);
                }

                // messaggi non letti
                if (msg.receiver_id === user.id && !msg.is_read) {
                    unread.add(msg.sender_id);
                }
            });

            setConversations(Array.from(convMap.values()));
            setUnreadMessages(unread);
        }
        setLoadingMessages(false);
    };

    // carica conversazioni quando apro tab messaggi
    useEffect(() => {
        if (activeTab === 'messages' && user && !selectedConversation) {
            fetchConversations();
        }
    }, [activeTab, user, selectedConversation]);

    // realtime nuovi messaggi -> aggiorna lista conversazioni
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMessage = payload.new as Message;
                    if (
                        newMessage.sender_id === user.id ||
                        newMessage.receiver_id === user.id
                    ) {
                        fetchConversations();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // salva modifiche profilo
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;
        setLoading(true);

        let avatar_url = profile.avatar_url;
        if (avatarFile) {
            const filePath = `public/${user.id}/${Date.now()}-${avatarFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                toast.error(uploadError.message);
                setLoading(false);
                return;
            }
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            avatar_url = data.publicUrl;
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                bio,
                gender,
                status,
                avatar_url,
            })
            .eq('id', user.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(t('dashboard.profileUpdated'));
            await refreshProfile();
        }
        setLoading(false);
    };

    // genera bio con AI
    const handleGenerateBio = async () => {
        if (!bio.trim()) {
            toast.error(t('dashboard.bioSuggestionError'));
            return;
        }
        setIsGeneratingBio(true);
        try {
            const ai = new GoogleGenAI({
                apiKey: process.env.API_KEY as string,
            });
            const model = 'gemini-2.5-flash';
            const prompt = `Migliora e rendi più intrigante questa bio per un sito di incontri per adulti, mantenendo lo stesso significato e tono. Sii breve e diretto. Bio originale: "${bio}"`;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
            });

            const newBio = response.text.trim();
            if (newBio) {
                setBio(newBio);
                toast.success(t('dashboard.bioSuggestionSuccess'));
            } else {
                throw new Error('Empty response from AI');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            toast.error(t('dashboard.bioSuggestionErrorAPI'));
        } finally {
            setIsGeneratingBio(false);
        }
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
        setUnreadMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(recipient.id);
            return newSet;
        });
    };

    const handleBackToConversations = () => {
        setSelectedConversation(null);
        fetchConversations(); // refresh lista
    };

    // ---------- RENDER -----------
    return (
        <>
            {/* overlay scuro dietro il pannello */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            <div
                className={`fixed top-0 right-0 h-full bg-gray-800 shadow-xl w-full max-w-lg z-50 flex flex-col transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* pulsante chiudi */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white z-20"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                {/* barra tab SOLO se non sono in chat singola */}
                {!(activeTab === 'messages' && selectedConversation) && (
                    <div className="p-4 border-b border-gray-700 flex-shrink-0">
                        <div className="flex flex-wrap gap-4">
                            {/* Tab Profilo */}
                            <button
                                onClick={() => {
                                    setActiveTab('profile');
                                    setSelectedConversation(null);
                                }}
                                className={`px-4 py-2 text-sm font-semibold ${
                                    activeTab === 'profile'
                                        ? 'text-red-500 border-b-2 border-red-500'
                                        : 'text-gray-400'
                                }`}
                            >
                                {t('dashboard.profileTab')}
                            </button>

                            {/* Tab Messaggi */}
                            <button
                                onClick={() => {
                                    setActiveTab('messages');
                                    setSelectedConversation(null);
                                }}
                                className={`px-4 py-2 text-sm font-semibold relative ${
                                    activeTab === 'messages'
                                        ? 'text-red-500 border-b-2 border-red-500'
                                        : 'text-gray-400'
                                }`}
                            >
                                {t('dashboard.messagesTab')}
                                {unreadMessages.size > 0 && (
                                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                            </button>

                            {/* Tab Visite (VIP only) */}
                            {vip && (
                                <button
                                    onClick={() => {
                                        setActiveTab('visitors');
                                        setSelectedConversation(null);
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold ${
                                        activeTab === 'visitors'
                                            ? 'text-red-500 border-b-2 border-red-500'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    Visite
                                </button>
                            )}

                            {/* Tab Likes ricevuti (VIP only) */}
                            {vip && (
                                <button
                                    onClick={() => {
                                        setActiveTab('likes');
                                        setSelectedConversation(null);
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold ${
                                        activeTab === 'likes'
                                            ? 'text-red-500 border-b-2 border-red-500'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    Likes
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* CONTENUTO PRINCIPALE */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* TAB: PROFILO */}
                    {activeTab === 'profile' && profile && (
                        <div className="p-6">
                            <form
                                onSubmit={handleProfileUpdate}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-4">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <UserCircleIcon className="h-20 w-20 text-gray-500" />
                                    )}
                                    <div>
                                        <label
                                            htmlFor="avatar-upload"
                                            className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-md"
                                        >
                                            {t('dashboard.changePhoto')}
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </div>
                                </div>

                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">
                                        {t('dashboard.displayName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) =>
                                            setDisplayName(e.target.value)
                                        }
                                        className="w-full bg-gray-700 p-2 rounded-md"
                                    />
                                </div>

                                {/* Bio + pulsante AI */}
                                <div>
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-gray-300">
                                            {t('dashboard.bio')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateBio}
                                            disabled={isGeneratingBio}
                                            className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                        >
                                            <SparklesIcon
                                                className={`h-4 w-4 ${
                                                    isGeneratingBio
                                                        ? 'animate-spin'
                                                        : ''
                                                }`}
                                            />
                                            {isGeneratingBio
                                                ? t('dashboard.improving')
                                                : t(
                                                      'dashboard.improveWithAI'
                                                  )}
                                        </button>
                                    </div>
                                    <textarea
                                        value={bio}
                                        onChange={(e) =>
                                            setBio(e.target.value)
                                        }
                                        rows={3}
                                        className="w-full bg-gray-700 p-2 rounded-md mt-1"
                                    />
                                </div>

                                {/* Gender / Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">
                                            {t('dashboard.gender')}
                                        </label>
                                        <select
                                            value={gender}
                                            onChange={(e) =>
                                                setGender(e.target.value)
                                            }
                                            className="w-full bg-gray-700 p-2 rounded-md"
                                        >
                                            <option value="">
                                                {t('dashboard.select')}
                                            </option>
                                            <option value="M">
                                                {t('genders.M')}
                                            </option>
                                            <option value="F">
                                                {t('genders.F')}
                                            </option>
                                            <option value="Trav">
                                                {t('genders.Trav')}
                                            </option>
                                            <option value="Trans">
                                                {t('genders.Trans')}
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">
                                            {t('dashboard.status')}
                                        </label>
                                        <select
                                            value={status || 'Single'}
                                            onChange={(e) =>
                                                setStatus(
                                                    e.target.value as
                                                        | 'Single'
                                                        | 'Coppia'
                                                )
                                            }
                                            className="w-full bg-gray-700 p-2 rounded-md"
                                        >
                                            <option value="Single">
                                                {t('dashboard.single')}
                                            </option>
                                            <option value="Coppia">
                                                {t('dashboard.couple')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* salva */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500"
                                >
                                    {loading
                                        ? t('dashboard.saving')
                                        : t('dashboard.saveChanges')}
                                </button>

                                {/* Danger Zone */}
                                <div className="pt-4 mt-4 border-t border-gray-700 text-center">
                                    <h3 className="font-semibold text-red-500">
                                        {t(
                                            'venueDashboard.dangerZoneTitle'
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-2">
                                        {t(
                                            'venueDashboard.dangerZoneDescription'
                                        )}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDeleteModal(true)
                                        }
                                        className="text-sm text-red-500 hover:underline bg-red-900/50 px-3 py-1 rounded-md"
                                    >
                                        {t(
                                            'venueDashboard.deleteVenueAccount'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB: MESSAGGI */}
                    {activeTab === 'messages' && (
                        <div className="h-full">
                            {selectedConversation ? (
                                <ChatView
                                    recipient={selectedConversation}
                                    onBack={handleBackToConversations}
                                    presenceChannel={presenceChannel}
                                    onlineUsers={onlineUsers}
                                />
                            ) : (
                                <div className="p-6">
                                    {loadingMessages ? (
                                        <p>{t('dashboard.loadingMessages')}</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {conversations.length > 0 ? (
                                                conversations.map((msg) => {
                                                    const otherUser =
                                                        msg.sender_id ===
                                                        user?.id
                                                            ? msg.receiver
                                                            : msg.sender;
                                                    if (!otherUser)
                                                        return null;
                                                    const isUnread =
                                                        unreadMessages.has(
                                                            otherUser.id
                                                        );

                                                    return (
                                                        <li
                                                            key={msg.id}
                                                            onClick={() =>
                                                                handleSelectConversation(
                                                                    otherUser
                                                                )
                                                            }
                                                            className="bg-gray-700 p-3 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-600 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                {otherUser.avatar_url ? (
                                                                    <img
                                                                        src={
                                                                            otherUser.avatar_url
                                                                        }
                                                                        alt={
                                                                            otherUser.display_name
                                                                        }
                                                                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <UserCircleIcon className="h-10 w-10 text-gray-500 flex-shrink-0" />
                                                                )}
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p
                                                                        className={`font-semibold truncate ${
                                                                            isUnread
                                                                                ? 'text-white'
                                                                                : 'text-gray-300'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            otherUser.display_name
                                                                        }
                                                                    </p>
                                                                    <p
                                                                        className={`text-sm truncate ${
                                                                            isUnread
                                                                                ? 'text-white'
                                                                                : 'text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            msg.content
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                                {isUnread && (
                                                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                                                                )}
                                                                <div className="text-xs text-gray-400">
                                                                    {new Date(
                                                                        msg.created_at!
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-center text-gray-500 italic py-8">
                                                    {t(
                                                        'dashboard.noMessages'
                                                    )}
                                                </p>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: VISITORS (VIP only) */}
                    {activeTab === 'visitors' && vip && (
                        <VisitorsTab />
                    )}

                    {/* TAB: LIKES (VIP only) */}
                    {activeTab === 'likes' && vip && (
                        <LikesReceivedTab />
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <DeleteAccountModal
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={onClose}
                />
            )}
        </>
    );
};

export default DashboardPanel;

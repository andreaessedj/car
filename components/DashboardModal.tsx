import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { XMarkIcon, UserCircleIcon, PaperAirplaneIcon, ArrowLeftIcon, CalendarDaysIcon, SparklesIcon } from './icons';
import { useTranslation } from '../i18n';
import type { Message, Profile } from '../types';
import VipStatusIcon from './VipStatusIcon';
import { isVipActive } from '../utils/vip';

interface DashboardModalProps {
    onClose: () => void;
}

type Conversation = {
    otherUser: Profile;
    messages: Message[];
    unreadCount: number;
    lastMessageTimestamp: string;
};

const DashboardModal: React.FC<DashboardModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { user, profile, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'messages'>('profile');

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('');
    const [status, setStatus] = useState<'Single' | 'Coppia'>('Single');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Messages state
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const unreadCount = useMemo(() => {
        return conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
    }, [conversations]);

    const formatMessageTimestamp = useCallback((dateString: string | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
        
        if (messageDay.getTime() === today.getTime()) {
            return date.toLocaleTimeString([], timeOptions);
        }
        
        if (messageDay.getTime() === yesterday.getTime()) {
            return `${t('dashboard.yesterday')} ${date.toLocaleTimeString([], timeOptions)}`;
        }
        
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    }, [t]);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(id, display_name, avatar_url, is_vip, vip_until), receiver:profiles!receiver_id(id, display_name, avatar_url, is_vip, vip_until)')
            .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching messages:', error);
            toast.error(t('toasts.messagesLoadError'));
        } else if (data) {
            setAllMessages(data as any);
        }
    }, [user, t]);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setGender(profile.gender || '');
            setStatus(profile.status || 'Single');
            setAvatarPreview(profile.avatar_url || null);
        }
    }, [profile]);
    
    useEffect(() => {
        if(activeTab === 'messages') {
            fetchMessages();
        }
    }, [activeTab, fetchMessages]);

     useEffect(() => {
        if (!user) return;

        const grouped: Record<string, Conversation> = {};
        for (const msg of allMessages) {
            const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;

            if (!otherUser) continue;

            if (!grouped[otherUserId]) {
                grouped[otherUserId] = {
                    otherUser: otherUser,
                    messages: [],
                    unreadCount: 0,
                    lastMessageTimestamp: '1970-01-01T00:00:00Z',
                };
            }
            
            const conversation = grouped[otherUserId];
            
            conversation.messages.push(msg);
            if (!msg.is_read && msg.receiver_id === user.id) {
                conversation.unreadCount++;
            }
            if (msg.created_at && msg.created_at > conversation.lastMessageTimestamp) {
                conversation.lastMessageTimestamp = msg.created_at;
            }
        }

        Object.values(grouped).forEach(conv => conv.messages.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()));
        
        const sortedConversations = Object.values(grouped).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

        setConversations(sortedConversations);

    }, [allMessages, user]);


    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel(`private-messages-for-${user.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `receiver_id=eq.${user.id}` 
            }, () => {
                 fetchMessages();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchMessages]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCancel = () => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setGender(profile.gender || '');
            setStatus(profile.status || 'Single');
            setAvatarFile(null);
            setAvatarPreview(profile.avatar_url || null);
        }
        setIsEditing(false);
    };

    const handleSave = () => {
        if (!user || !profile) return;
        setLoading(true);

        const savePromise = async () => {
            let avatarUrl = profile.avatar_url;
            if (avatarFile) {
                const filePath = `public/${user.id}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = data.publicUrl;
            }
            const { error: updateError } = await supabase.from('profiles').update({
                display_name: displayName,
                bio,
                gender: gender || null,
                status,
                avatar_url: avatarUrl,
            }).eq('id', user.id);
            if (updateError) throw updateError;
            await refreshProfile();
        };

        toast.promise(
            savePromise(),
            {
                loading: t('toasts.savingProfile'),
                success: t('dashboard.profileUpdated'),
                error: (err: any) => err.message || t('dashboard.profileUpdateFailed'),
            }
        ).then(() => {
            setIsEditing(false);
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleExtendVip = async () => {
        if (!user || !profile) return;
        
        const currentExpiry = profile.vip_until ? new Date(profile.vip_until) : new Date();
        const now = new Date();
        // Extend from the current expiry date if it's in the future, otherwise extend from today
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        const extendPromise = supabase.from('profiles').update({
            is_vip: true,
            vip_until: newExpiry.toISOString()
        }).eq('id', user.id).then(async ({ error }) => {
            if (error) throw error;
            await refreshProfile();
        });

        toast.promise(extendPromise, {
            loading: t('toasts.processing'),
            success: t('toasts.vipExtended'),
            error: t('toasts.vipExtensionFailed')
        });
    };


    const handleSelectConversation = async (conv: Conversation) => {
        setSelectedConversation(conv);
        if (conv.unreadCount > 0) {
            const unreadIds = conv.messages.filter(m => !m.is_read && m.receiver_id === user?.id).map(m => m.id);
            if (unreadIds.length > 0) {
                await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
                fetchMessages(); // Refresh all data to ensure consistency
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageContent.trim() || !selectedConversation || !user) return;
        setIsSending(true);
        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: selectedConversation.otherUser.id,
            content: newMessageContent.trim(),
            is_read: false,
        });
        if (error) {
            toast.error(t('messageModal.error'));
        } else {
            setNewMessageContent('');
            await fetchMessages();
        }
        setIsSending(false);
    }

    const renderVipStatus = () => {
        if (!profile) return null;
        
        const expiryDate = profile.vip_until ? new Date(profile.vip_until) : null;
        const formattedDate = expiryDate ? expiryDate.toLocaleDateString() : '';

        return (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">{t('dashboard.vipStatusTitle')}</h3>
                <div className="flex items-center justify-between">
                    {profile.is_vip ? (
                         <div className="flex items-center gap-2">
                             <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                             {isVipActive(profile) ? (
                                 <p className="text-green-400">{t('dashboard.vipActiveUntil', { date: formattedDate })}</p>
                             ) : (
                                 <p className="text-red-400">{t('dashboard.vipExpiredOn', { date: formattedDate })}</p>
                             )}
                         </div>
                    ) : (
                        <p className="text-gray-400">{t('dashboard.notVip')}</p>
                    )}
                    
                     <button
                        onClick={handleExtendVip}
                        disabled
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md transition duration-300 flex items-center gap-2 text-sm disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="h-5 w-5" />
                        {t('dashboard.extendVipComingSoon')}
                    </button>
                </div>
            </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="flex border-b border-gray-700 sticky top-0 bg-gray-800 z-10 px-6 pt-2 flex-shrink-0">
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-center font-semibold ${activeTab === 'profile' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('dashboard.profileTab')}</button>
                    <button onClick={() => setActiveTab('messages')} className={`flex-1 py-3 text-center font-semibold relative ${activeTab === 'messages' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>
                        {t('dashboard.messagesTab')}
                        {unreadCount > 0 && <span className="absolute top-2 right-4 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {activeTab === 'profile' ? (
                        <div className="p-6">
                             <div className="flex items-start gap-6">
                                <div className="relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-600" />
                                    ) : (
                                        <UserCircleIcon className="w-24 h-24 md:w-32 md:h-32 text-gray-500" />
                                    )}
                                    {isEditing && (
                                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-red-600 p-2 rounded-full cursor-pointer hover:bg-red-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                            <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    {!isEditing ? (
                                        <>
                                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                                <span>{profile?.display_name || 'User'}</span>
                                                <VipStatusIcon profile={profile} className="h-7 w-7" />
                                            </h2>
                                            <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
                                            <p className="text-gray-300 whitespace-pre-wrap mb-4">{profile?.bio || t('dashboard.noBio')}</p>
                                            <div className="flex gap-4 text-sm text-gray-300">
                                                <span><strong>{t('dashboard.gender')}:</strong> {profile?.gender || t('checkinDetail.notAvailable')}</span>
                                                <span><strong>{t('dashboard.status')}:</strong> {profile?.status === 'Coppia' ? t('dashboard.couple') : (profile?.status ? t('dashboard.single') : t('checkinDetail.notAvailable'))}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div><label className="block text-gray-300 mb-1">{t('dashboard.displayName')}</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" /></div>
                                            <div><label className="block text-gray-300 mb-1">{t('dashboard.bio')}</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" /></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-300 mb-1">{t('dashboard.gender')}</label>
                                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                                                        <option value="">{t('dashboard.select')}</option><option value="M">M</option><option value="F">F</option><option value="Trav">Trav</option><option value="Trans">Trans</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-1">{t('dashboard.status')}</label>
                                                    <select value={status} onChange={(e) => setStatus(e.target.value as 'Single' | 'Coppia')} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                                                        <option value="Single">{t('dashboard.single')}</option><option value="Coppia">{t('dashboard.couple')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                {isEditing ? (
                                    <><button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">{t('dashboard.cancel')}</button><button onClick={handleSave} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500">{loading ? t('dashboard.saving') : t('dashboard.saveChanges')}</button></>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">{t('dashboard.editProfile')}</button>
                                )}
                            </div>
                            {!isEditing && renderVipStatus()}
                        </div>
                    ) : (
                       <div className="flex h-full flex-col md:flex-row">
                           <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto ${selectedConversation ? 'hidden md:block' : ''}`}>
                               {conversations.length > 0 ? conversations.map(conv => (
                                   <div key={conv.otherUser.id} onClick={() => handleSelectConversation(conv)} className={`p-4 cursor-pointer flex items-center gap-3 ${selectedConversation?.otherUser.id === conv.otherUser.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
                                       {conv.otherUser.avatar_url ? (
                                           <img src={conv.otherUser.avatar_url} alt={conv.otherUser.display_name} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                                       ) : (
                                           <UserCircleIcon className="h-12 w-12 text-gray-500 flex-shrink-0"/>
                                       )}
                                       <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-white truncate flex items-center gap-1.5">
                                                    <span className="truncate">{conv.otherUser.display_name}</span>
                                                    <VipStatusIcon profile={conv.otherUser} className="h-4 w-4 flex-shrink-0" />
                                                </p>
                                                {conv.unreadCount > 0 && <span className="bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
                                            </div>
                                            <p className="text-sm text-gray-400 truncate">{conv.messages[conv.messages.length - 1]?.content}</p>
                                       </div>
                                   </div>
                               )) : (
                                <p className="text-gray-500 text-center p-8">{t('dashboard.noMessages')}</p>
                               )}
                           </div>
                           <div className={`w-full md:w-2/3 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                               {selectedConversation ? (
                                    <>
                                    <div className="p-4 border-b border-gray-700 flex-shrink-0 flex items-center gap-3">
                                        <button onClick={() => setSelectedConversation(null)} className="md:hidden p-1 rounded-full hover:bg-gray-700" aria-label="Back to conversations">
                                            <ArrowLeftIcon className="h-6 w-6 text-white"/>
                                        </button>
                                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                            <span>{t('dashboard.chatWith', { name: selectedConversation.otherUser.display_name })}</span>
                                            <VipStatusIcon profile={selectedConversation.otherUser} className="h-5 w-5" />
                                        </h3>
                                    </div>
                                    <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                                        {selectedConversation.messages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <p className="text-xs text-right mt-1 opacity-70">{formatMessageTimestamp(msg.created_at)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t border-gray-700 flex-shrink-0">
                                         <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input type="text" placeholder={t('dashboard.typeMessagePlaceholder')} value={newMessageContent} onChange={e => setNewMessageContent(e.target.value)} className="flex-1 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                            <button type="submit" disabled={isSending} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-md transition duration-300 disabled:bg-gray-500">
                                                <PaperAirplaneIcon className="h-6 w-6"/>
                                            </button>
                                        </form>
                                    </div>
                                    </>
                               ) : (
                                 <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">{t('dashboard.selectConversation')}</p>
                                 </div>
                               )}
                           </div>
                       </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardModal;
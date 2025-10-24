
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import type { Message, Profile } from '../types';
import { ArrowLeftIcon, PaperAirplaneIcon, UserCircleIcon } from './icons';
import { useTranslation } from '../i18n';

interface ChatViewProps {
    recipient: Profile;
    onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ recipient, onBack }) => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:sender_id(*)')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            toast.error(error.message);
        } else {
            setMessages(data as any[] || []);
        }
        setLoading(false);
    }, [user, recipient.id]);
    
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        const markAsRead = async () => {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', recipient.id)
                .eq('receiver_id', user.id)
                .eq('is_read', false);
        };
        markAsRead();
        
        const channel = supabase.channel(`messages-from-${recipient.id}-to-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                if ((payload.new as Message).sender_id === recipient.id) {
                     setMessages(prev => [...prev, payload.new as Message]);
                     markAsRead();
                }
            }).subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, recipient.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const content = newMessage.trim();
        setNewMessage('');
        
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            content,
            sender_id: user.id,
            receiver_id: recipient.id,
            created_at: new Date().toISOString(),
            is_read: false,
            sender: profile as Profile,
        };
        setMessages(prev => [...prev, optimisticMessage]);

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: recipient.id,
            content,
        });
        
        if (error) {
            toast.error(t('messageModal.error'));
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };
    
    return (
        <div className="h-full flex flex-col">
             <div className="p-4 border-b border-gray-700 flex items-center gap-3 flex-shrink-0 sticky top-0 bg-gray-800 z-10">
                <button onClick={onBack} className="text-gray-400 hover:text-white">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                {recipient.avatar_url ? (
                    <img src={recipient.avatar_url} alt={recipient.display_name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-500" />
                )}
                <h3 className="font-bold text-lg">{recipient.display_name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <p className="text-center text-gray-400">Caricamento messaggi...</p>
                ) : messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-red-600' : 'bg-gray-600'}`}>
                             <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
                             <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-red-200' : 'text-gray-400'} text-right`}>
                                {new Date(msg.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 italic">Inizia la conversazione!</p>
                )}
                 <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Scrivi un messaggio..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="flex-1 bg-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />
                    <button type="submit" className="bg-red-600 p-2 rounded-md hover:bg-red-700 transition-colors">
                        <PaperAirplaneIcon className="h-6 w-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatView;

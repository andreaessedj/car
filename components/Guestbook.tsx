import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import type { GuestbookMessage } from '../types';
import { toast } from 'react-hot-toast';
import { PaperAirplaneIcon } from './icons';

const timeAgo = (dateString: string, t: (key: string, options?: { [key: string]: string | number }) => string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        const value = Math.floor(interval);
        return `${value}${t(value === 1 ? 'timeAgo.year' : 'timeAgo.years')}`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const value = Math.floor(interval);
        return `${value}${t(value === 1 ? 'timeAgo.month' : 'timeAgo.months')}`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const value = Math.floor(interval);
        return `${value}${t(value === 1 ? 'timeAgo.day' : 'timeAgo.days')}`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const value = Math.floor(interval);
        return `${value}${t(value === 1 ? 'timeAgo.hour' : 'timeAgo.hours')}`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const value = Math.floor(interval);
        return `${value}${t(value === 1 ? 'timeAgo.minute' : 'timeAgo.minutes')}`;
    }
    return t('timeAgo.justNow');
};

const Guestbook: React.FC = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<GuestbookMessage[]>([]);
    const [nickname, setNickname] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setNickname(profile.display_name);
        } else {
            setNickname('');
        }
    }, [profile]);

    const fetchMessages = useCallback(async () => {
        const { data, error } = await supabase
            .from('guestbook_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error fetching guestbook messages:', error);
        } else {
            setMessages(data || []);
        }
    }, []);

    useEffect(() => {
        fetchMessages();

        const channel = supabase.channel('guestbook-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook_messages' }, 
            (payload) => {
                setMessages(prev => [payload.new as GuestbookMessage, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMessages]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim() || !message.trim()) {
            return;
        }
        setLoading(true);

        const { error } = await supabase.from('guestbook_messages').insert({
            nickname: nickname.trim(),
            message: message.trim(),
            user_id: user?.id || null,
        });
        
        if (error) {
            toast.error(error.message);
        } else {
            setMessage('');
            if (!user) { // Clear nickname only for anonymous users
                setNickname('');
            }
            toast.success(t('guestbook.success'));
        }
        setLoading(false);
    };

    return (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-80 max-w-[80vw] h-[60vh] max-h-[550px] bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-lg shadow-xl z-10 flex flex-col p-3 text-white">
            <h2 className="text-lg font-bold text-red-500 mb-2 border-b border-gray-600 pb-1.5">{t('guestbook.title')}</h2>
            
            <div className="flex-grow overflow-y-auto pr-1.5 space-y-2 custom-scrollbar">
                {messages.length > 0 ? messages.map(msg => (
                     <div key={msg.id} className="bg-gray-800 bg-opacity-60 p-2 rounded-lg">
                        <div className="flex justify-between items-baseline">
                            <p className="font-bold text-red-400 text-sm break-all">{msg.nickname}</p>
                            <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(msg.created_at, t)}</p>
                        </div>
                        <p className="text-gray-200 mt-1 whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">{t('guestbook.noMessages')}</p>
                    </div>
                )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-600">
                <h3 className="font-semibold mb-1.5 text-sm">{t('guestbook.signTitle')}</h3>
                <form onSubmit={handleSubmit} className="space-y-2">
                     <div>
                        <label htmlFor="nickname" className="sr-only">{t('guestbook.nickname')}</label>
                        <input
                            id="nickname"
                            type="text"
                            placeholder={t('guestbook.nickname')}
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full bg-gray-700 text-white py-1.5 px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="message" className="sr-only">{t('guestbook.message')}</label>
                         <textarea
                            id="message"
                            placeholder={t('guestbook.message')}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                            className="w-full bg-gray-700 text-white py-1.5 px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-md transition duration-300 disabled:bg-gray-500 text-sm"
                    >
                         {loading ? t('guestbook.signing') : t('guestbook.sign')}
                        <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Guestbook;
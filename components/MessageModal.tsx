import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { XMarkIcon, PaperAirplaneIcon } from './icons';
import { useTranslation } from '../i18n';
import type { Profile } from '../types';

interface MessageModalProps {
    recipient: Profile;
    onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ recipient, onClose }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;
        setLoading(true);

        const sendMessagePromise = supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: recipient.id,
            content: content.trim(),
            is_read: false,
        }).then(({ error }) => {
            if (error) throw error;
        });

        toast.promise(
            sendMessagePromise,
            {
                loading: t('messageModal.sending'),
                success: () => {
                    onClose();
                    return t('messageModal.success');
                },
                error: (err: any) => err.message || t('messageModal.error'),
            }
        ).finally(() => setLoading(false));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">{t('messageModal.title', { name: recipient.display_name })}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="message-content" className="sr-only">{t('messageModal.placeholder')}</label>
                        <textarea 
                            id="message-content"
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            rows={5} 
                            className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                            placeholder={t('messageModal.placeholder')}
                            required 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500"
                    >
                        {loading ? t('messageModal.sending') : t('messageModal.send')}
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MessageModal;
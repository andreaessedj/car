import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { Checkin, Comment } from '../types';
import { XMarkIcon, UserIcon, MapPinIcon, PaperAirplaneIcon, ArrowTopRightOnSquareIcon } from './icons';
import { useTranslation } from '../i18n';
import VipStatusIcon from './VipStatusIcon';
import { useAuth } from '../hooks/useAuth';

interface CheckinDetailModalProps {
    checkin: Checkin;
    onClose: () => void;
}

const CheckinDetailModal: React.FC<CheckinDetailModalProps> = ({ checkin, onClose }) => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const isFakeCheckin = checkin.id < 0;

    useEffect(() => {
        if (isFakeCheckin) {
            setComments([]);
            return;
        }

        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('checkin_id', checkin.id)
                .order('created_at', { ascending: true });
            
            if (error) {
                toast.error(t('toasts.commentsLoadError'));
                console.error(error);
            } else {
                setComments(data);
            }
        };
        fetchComments();

        const channel = supabase.channel(`comments-for-${checkin.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `checkin_id=eq.${checkin.id}` }, (payload) => {
                const newCommentPayload = payload.new as Comment;
                setComments(prev => {
                    if (prev.some(c => c.id === newCommentPayload.id)) {
                        return prev;
                    }
                    return [...prev, newCommentPayload];
                });
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [checkin.id, t, isFakeCheckin]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '' || !user || profile?.profile_type !== 'user') {
            toast.error("Solo gli utenti possono commentare.");
            return;
        }

        setLoading(true);
        const { data: insertedComment, error } = await supabase.from('comments').insert({
            checkin_id: checkin.id,
            text: newComment.trim(),
            user_id: user.id,
        }).select().single();

        if (error) {
            toast.error(error.message);
        } else if (insertedComment) {
            setComments(prev => [...prev, insertedComment]);
            setNewComment('');
        }
        setLoading(false);
    };
    
    const canComment = user && profile?.profile_type === 'user';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <span>{checkin.nickname}</span>
                        <VipStatusIcon profile={checkin.profiles} className="h-6 w-6" />
                    </h2>
                    <div className="flex items-center text-sm text-gray-400 gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                           <UserIcon className="h-4 w-4" /> 
                           <span>{checkin.status === 'Coppia' ? t('genders.Coppia') : checkin.gender || t('checkinDetail.notAvailable')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <MapPinIcon className="h-4 w-4" /> 
                           <span>{checkin.city || t('map.unknownLocation')}</span>
                        </div>
                        <a 
                            href={`https://www.google.com/maps?q=${checkin.lat},${checkin.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            <span>{t('checkinDetail.directions')}</span>
                        </a>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {checkin.photo && <img src={checkin.photo} alt={checkin.nickname} className="rounded-lg w-full max-h-72 object-cover mb-4" />}
                    <p className="text-gray-300 whitespace-pre-wrap">{checkin.description}</p>
                    
                    <h3 className="text-lg font-semibold text-white pt-4 border-t border-gray-700">{t('checkinDetail.comments')}</h3>
                    <div className="space-y-3">
                        {comments.length > 0 ? comments.map(comment => (
                            <div key={comment.id} className="bg-gray-700 rounded-lg p-3">
                                <p className="text-gray-200 whitespace-pre-wrap">{comment.text}</p>
                                <p className="text-xs text-gray-400 text-right mt-2">
                                    {comment.created_at ? new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                </p>
                            </div>
                        )) : <p className="text-gray-500">{t('checkinDetail.noComments')}</p>}
                         <div ref={commentsEndRef} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    {isFakeCheckin ? (
                        <p className="text-center text-gray-400 text-sm">
                           Non è possibile commentare i check-in dimostrativi.
                        </p>
                    ) : canComment ? (
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input 
                                type="text"
                                placeholder={t('checkinDetail.addComment')}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                className="flex-1 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                            />
                            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-md transition duration-300 disabled:bg-gray-500">
                                <PaperAirplaneIcon className="h-6 w-6"/>
                            </button>
                        </form>
                    ) : (
                         <p className="text-center text-gray-400 text-sm">
                            {user ? "Solo i profili utente possono commentare." : "Devi effettuare l'accesso per poter commentare."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckinDetailModal;
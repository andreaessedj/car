import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { HeartIcon } from './icons';
import { toast } from 'react-hot-toast';

const LikeButtonSmall: React.FC<{ targetUserId?: string }> = ({ targetUserId }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  if (!targetUserId || !profile || targetUserId === profile.id) return null;

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.from('likes').insert({ from_user: profile.id, to_user: targetUserId });
    setLoading(false);
    if (error) toast.error('Errore, riprova');
    else toast.success('Like inviato ❤️');
  };

  return (
    <button disabled={loading} onClick={handleLike} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1 disabled:bg-gray-600">
      <HeartIcon className="h-4 w-4" />
      <span>{loading ? '...' : 'Like'}</span>
    </button>
  );
};
export default LikeButtonSmall;

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserCircleIcon } from './icons';
import { isVipActive } from '../utils/vip';
import LikeButtonSmall from './LikeButtonSmall';

interface IncomingLike { from_user: string; created_at: string; from_profile: { id: string; display_name: string; avatar_url: string | null; is_vip: boolean | null; }; }

const LikesReceivedTab: React.FC = () => {
  const { profile } = useAuth();
  const [unmatchedLikes, setUnmatchedLikes] = useState<IncomingLike[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile || !isVipActive(profile)) return;
      const { data: incomingLikes } = await supabase.from('likes').select('from_user, created_at, from_profile:from_user(id, display_name, avatar_url, is_vip)').eq('to_user', profile.id);
      const { data: outgoingLikes } = await supabase.from('likes').select('to_user').eq('from_user', profile.id);
      const iLikedSet = new Set(outgoingLikes?.map(l => l.to_user));
      const filtered = (incomingLikes || []).filter(like => !iLikedSet.has(like.from_user));
      setUnmatchedLikes(filtered);
    };
    load();
  }, [profile]);

  if (!profile) return null;
  if (!isVipActive(profile)) return <div className="p-6 text-center text-gray-400 text-sm italic">Funzione riservata ai VIP.</div>;
  if (unmatchedLikes.length === 0) return <div className="p-6 text-center text-gray-500 italic text-sm">Nessun nuovo like non ricambiato.</div>;

  return (
    <div className="p-4 space-y-4">
      {unmatchedLikes.map(like => (
        <div key={like.from_user} className="bg-gray-700 p-3 rounded-md flex items-center gap-3">
          {like.from_profile?.avatar_url ? (
            <img src={like.from_profile.avatar_url} alt={like.from_profile.display_name} className="h-12 w-12 rounded-full object-cover" />
          ) : (<UserCircleIcon className="h-12 w-12 text-gray-500" />)}
          <div className="flex-1">
            <p className="text-white font-semibold">{like.from_profile?.display_name}</p>
            <p className="text-xs text-gray-400">Like ricevuto il {new Date(like.created_at).toLocaleString()}</p>
          </div>
          <LikeButtonSmall targetUserId={like.from_profile?.id} />
        </div>
      ))}
    </div>
  );
};
export default LikesReceivedTab;

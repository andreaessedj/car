import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserCircleIcon } from './icons';
import { isVipActive } from '../utils/vip';
import LikeButtonSmall from './LikeButtonSmall';

interface VisitorRow {
  viewer_id: string;
  created_at: string;
  viewer: { id: string; display_name: string; avatar_url: string | null; is_vip: boolean | null; };
}

const VisitorsTab: React.FC = () => {
  const { profile } = useAuth();
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile || !isVipActive(profile)) return;
      const { data } = await supabase.from('profile_views').select('viewer_id, created_at, viewer:viewer_id(id, display_name, avatar_url, is_vip)').eq('viewed_id', profile.id).order('created_at', { ascending: false }).limit(20);
      if (data) setVisitors(data as any);
    };
    load();
  }, [profile]);

  if (!profile) return null;
  if (!isVipActive(profile)) return <div className="p-6 text-center text-gray-400 text-sm italic">Funzione riservata ai VIP.</div>;
  if (visitors.length === 0) return <div className="p-6 text-center text-gray-500 italic text-sm">Nessuno ha ancora visitato il tuo profilo.</div>;

  return (
    <div className="p-4 space-y-4">
      {visitors.map(v => (
        <div key={v.viewer_id + v.created_at} className="bg-gray-700 p-3 rounded-md flex items-center gap-3">
          {v.viewer?.avatar_url ? (
            <img src={v.viewer.avatar_url} alt={v.viewer.display_name} className="h-12 w-12 rounded-full object-cover" />
          ) : (<UserCircleIcon className="h-12 w-12 text-gray-500" />)}
          <div className="flex-1">
            <p className="text-white font-semibold">{v.viewer?.display_name}</p>
            <p className="text-xs text-gray-400">Visitato il {new Date(v.created_at).toLocaleString()}</p>
          </div>
          <LikeButtonSmall targetUserId={v.viewer?.id} />
        </div>
      ))}
    </div>
  );
};
export default VisitorsTab;

import React, { useEffect } from 'react';
import type { Profile } from '../types';
import { XMarkIcon, UserCircleIcon, PaperAirplaneIcon } from './icons';
import { useTranslation } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import VipStatusIcon from './VipStatusIcon';

interface UserProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onSendMessage: (profile: Profile) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile: viewedProfile, onClose, onSendMessage }) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  useEffect(() => {
    const registerView = async () => {
      if (!user || !profile) return;
      if (profile.id === viewedProfile.id) return;
      await supabase.from('profile_views').insert({ viewer_id: profile.id, viewed_id: viewedProfile.id });
    };
    registerView();
  }, [user, profile, viewedProfile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">{t('userProfile.title')}</h2>
        <div className="flex items-start gap-6">
          <div>
            {viewedProfile.avatar_url ? (
              <img src={viewedProfile.avatar_url} alt={viewedProfile.display_name} className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-gray-600" />
            ) : (<UserCircleIcon className="w-24 h-24 md:w-28 md:h-28 text-gray-500" />)}
          </div>
          <div className="flex-1 mt-2">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{viewedProfile.display_name}</span>
              <VipStatusIcon profile={viewedProfile} className="h-6 w-6" />
            </h3>
            <p className="text-gray-300 whitespace-pre-wrap my-3">{viewedProfile.bio || t('dashboard.noBio')}</p>
            <div className="flex flex-col gap-2 text-sm text-gray-300 mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <strong className="w-16">{t('dashboard.gender')}:</strong>
                <span>{viewedProfile.gender ? t(`genders.${viewedProfile.gender as 'M'|'F'|'Trav'|'Trans'}`) : t('checkinDetail.notAvailable')}</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="w-16">{t('dashboard.status')}:</strong>
                <span>{viewedProfile.status === 'Coppia' ? t('dashboard.couple') : (viewedProfile.status ? t('dashboard.single') : t('checkinDetail.notAvailable'))}</span>
              </div>
            </div>
          </div>
        </div>
        {user?.id !== viewedProfile.id && (
          <div className="mt-6">
            <button onClick={() => onSendMessage(viewedProfile)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
              <PaperAirplaneIcon className="h-5 w-5" />
              {t('userProfile.sendMessage')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserProfileModal;

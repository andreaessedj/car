import React from 'react';
import type { Profile } from '../types';
import { UserIcon } from './icons';
import { useTranslation } from '../i18n';

interface RecentUsersSliderProps {
    users: Profile[];
    onUserClick: (user: Profile) => void;
}

const RecentUsersSlider: React.FC<RecentUsersSliderProps> = ({ users, onUserClick }) => {
    const { t } = useTranslation();

    if (users.length === 0) {
        return <div className="h-32"></div>; // Placeholder for alignment
    }

    return (
        <div className="h-32 overflow-x-auto overflow-y-hidden flex space-x-3 pb-2 custom-scrollbar">
            {users.map((user) => (
                <div 
                    key={user.id} 
                    onClick={() => onUserClick(user)}
                    className="flex-shrink-0 w-48 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-colors overflow-hidden flex flex-col"
                >
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-full h-16 object-cover" />
                    ) : (
                        <div className="w-full h-16 bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                    <div className="p-2 flex flex-col justify-between flex-grow">
                        <div>
                            <h4 className="font-bold text-white text-sm truncate">{user.display_name}</h4>
                            <p className="text-xs text-gray-300 truncate">{user.bio || t('dashboard.noBio')}</p>
                        </div>
                        {/* Placeholder to match alignment with check-in card's city row */}
                        <div className="flex items-center text-xs text-gray-400 mt-1 h-[14px]">
                            &nbsp;
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentUsersSlider;
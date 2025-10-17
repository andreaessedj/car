import React from 'react';
import type { Checkin } from '../types';
import { MapPinIcon, UserIcon } from './icons';
import { useTranslation } from '../i18n';
import VipStatusIcon from './VipStatusIcon';
import { isVipActive } from '../utils/vip';

interface RecentCheckinsSliderProps {
    checkins: Checkin[];
    onCheckinClick: (checkin: Checkin) => void;
}

const RecentCheckinsSlider: React.FC<RecentCheckinsSliderProps> = ({ checkins, onCheckinClick }) => {
    const { t } = useTranslation();

    if (checkins.length === 0) {
        return <div className="h-32"></div>; // Placeholder for alignment
    }

    return (
        <div className="h-32 overflow-x-auto overflow-y-hidden flex space-x-3 pb-2 custom-scrollbar">
            {checkins.map((checkin) => {
                const isVip = isVipActive(checkin.profiles);
                const cardClasses = isVip
                    ? 'border border-yellow-400/60 shadow-yellow-400/20'
                    : 'shadow-lg';
                
                return (
                    <div 
                        key={checkin.id} 
                        onClick={() => onCheckinClick(checkin)}
                        className={`flex-shrink-0 w-48 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-gray-700 transition-all overflow-hidden flex flex-col ${cardClasses}`}
                    >
                        {checkin.photo ? (
                            <img src={checkin.photo} alt={checkin.nickname} className="w-full h-16 object-cover" />
                        ) : (
                            <div className="w-full h-16 bg-gray-700 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div className="p-2 flex flex-col justify-between flex-grow">
                            <div>
                                <h4 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                                    <span className="truncate">{checkin.nickname}</span>
                                    <VipStatusIcon profile={checkin.profiles} className="h-4 w-4 flex-shrink-0" />
                                </h4>
                                <p className="text-xs text-gray-300 truncate">{checkin.description}</p>
                            </div>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{checkin.city || t('map.unknownLocation')}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RecentCheckinsSlider;
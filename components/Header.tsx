import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GENDERS } from '../constants';
import { FilterState, Profile } from '../types';
import { UserCircleIcon, UsersIcon, MagnifyingGlassIcon, SparklesIcon } from './icons';
import { useTranslation } from '../i18n';
import VipStatusIcon from './VipStatusIcon';
import { isVipActive } from '../utils/vip';

interface HeaderProps {
  onCheckInClick: () => void;
  onAuthClick: () => void;
  onDashboardClick: () => void;
  onBecomeVipClick: () => void;   // ⇦ deve aprire la barra VIP (VipPromoModal)
  onMatchClick: () => void;

  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  cityOptions: { value: string; label: string }[];

  onlineUsersCount: number;
  isCurrentUserOnline: boolean;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Profile[];
  onUserSearchSelect: (profile: Profile) => void;
}

const Header: React.FC<HeaderProps> = ({
  onCheckInClick,
  onAuthClick,
  onDashboardClick,
  onBecomeVipClick,  // ⇦ user click → apri barra
  onMatchClick,
  filters,
  setFilters,
  cityOptions,
  onlineUsersCount,
  isCurrentUserOnline,
  searchQuery,
  setSearchQuery,
  searchResults,
  onUserSearchSelect
}) => {
  const { user, signOut, profile } = useAuth();
  const { t } = useTranslation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isVip = isVipActive(profile);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-black/60 p-3 flex flex-wrap items-center justify-center lg:justify-between gap-3 shadow-lg backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-red-500 tracking-wider">{t('appName')}</h1>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* SEARCH */}
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchUsersPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full sm:w-48 bg-gray-700 text-white rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
              <ul>
                {searchResults.map(userResult => (
                  <li
                    key={userResult.id}
                    onClick={() => onUserSearchSelect(userResult)}
                    className="p-2 flex items-center gap-3 hover:bg-gray-700 cursor-pointer"
                  >
                    {userResult.avatar_url ? (
                      <img
                        src={userResult.avatar_url}
                        alt={userResult.display_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-500" />
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold text-sm truncate">
                        {userResult.display_name}
                      </span>
                      <VipStatusIcon profile={userResult} className="h-4 w-4 flex-shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* FILTER GENERE */}
        <select
          name="gender"
          title={t('filterGender')}
          value={filters.gender}
          onChange={handleFilterChange}
          className="bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {GENDERS.map(g => (
            <option key={g} value={g}>
              {t(`genders.${g}`)}
            </option>
          ))}
        </select>

        {/* FILTER CITY */}
        <select
          name="city"
          title={t('filterCity')}
          value={filters.city}
          onChange={handleFilterChange}
          className="bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {cityOptions.map(c => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* VIP FILTER (solo se utente è VIP attivo) */}
        {isVip && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-yellow-400">{t('vipOnlyFilter')}</span>
            <label htmlFor="vip-toggle" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="vip-toggle"
                className="sr-only peer"
                checked={filters.vipOnly}
                onChange={(e) => setFilters(prev => ({...prev, vipOnly: e.target.checked}))}
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* STATO ONLINE & COUNT */}
        <div className="flex items-center gap-3 text-white p-2 rounded-md bg-black/20">
          <div
            className={`h-2.5 w-2.5 rounded-full transition-colors ${isCurrentUserOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
            title={isCurrentUserOnline ? 'Online' : 'Offline'}
          />
          <div
            className="flex items-center gap-1.5 text-green-400"
            title={`${onlineUsersCount} ${t('usersOnline')}`}
          >
            <UsersIcon className="h-5 w-5"/>
            <span className="font-semibold text-sm">{onlineUsersCount}</span>
          </div>
        </div>

        {/* NUOVO BOTTONE MATCH (solo se loggato) */}
        {user && (
          <button
            onClick={onMatchClick}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm"
            title="Guarda profili compatibili"
          >
            Match
          </button>
        )}

        {/* CHECK-IN */}
        <button
          onClick={onCheckInClick}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm"
        >
          {t('newCheckin')}
        </button>

        {user ? (
          <>
            {/* AVATAR / DASHBOARD */}
            <button
              onClick={onDashboardClick}
              className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition duration-300"
              title={t('dashboard.profileTab')}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="You"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-6 w-6"/>
              )}
            </button>

            {/* VIP BADGE / UPGRADE */}
            {isVip ? (
              <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 font-bold py-2 px-4 rounded-md text-sm">
                <VipStatusIcon profile={profile} className="h-5 w-5" />
                <span>{t('header.isVip')}</span>
              </div>
            ) : (
              <button
                onClick={onBecomeVipClick}   // ⇦ ABILITATO: apre la barra con le opzioni
                title="Diventa VIP"
                className="bg-amber-300 text-black font-bold py-2 px-4 rounded-md text-sm flex items-center gap-2 border-2 border-black hover:brightness-90 transition"
              >
                <SparklesIcon className="h-5 w-5" />
                {/* usa i18n se hai la chiave, altrimenti fallback */}
                {t('Diventa VIP') || 'Diventa VIP'}
              </button>
            )}

            {/* LOGOUT */}
            <button
              onClick={signOut}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm"
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <button
            onClick={onAuthClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm"
          >
            {t('loginRegister')}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

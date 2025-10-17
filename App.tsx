import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';
import type { Checkin, FilterState, Profile } from './types';

import Header from './components/Header';
import MapView from './components/MapView';
import AuthModal from './components/AuthModal';
import CheckInModal from './components/CheckInModal';
import CheckinDetailModal from './components/CheckinDetailModal';
import DashboardModal from './components/DashboardModal';
import RecentCheckinsSlider from './components/RecentCheckinsSlider';
import RecentUsersSlider from './components/RecentUsersSlider';
import UserProfileModal from './components/UserProfileModal';
import MessageModal from './components/MessageModal';
import Guestbook from './components/Guestbook';
import DisclaimerModal from './components/DisclaimerModal';
import { useTranslation } from './i18n';
import { generateFakeCheckin } from './services/fakeData';
import VipPromoModal from './components/VipPromoModal';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

const App: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [checkins, setCheckins] = useState<Checkin[]>([]);
    const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
    const [isCurrentUserOnline, setIsCurrentUserOnline] = useState(false);
    const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
    const [isVipPromoModalOpen, setVipPromoModalOpen] = useState(false);

    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isDashboardModalOpen, setDashboardModalOpen] = useState(false);
    const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [messageRecipient, setMessageRecipient] = useState<Profile | null>(null);

    const [filters, setFilters] = useState<FilterState>({ gender: 'All', city: 'All' });
    const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);

    useEffect(() => {
        const accepted = getCookie('disclaimerAccepted') === 'true';
        setIsDisclaimerAccepted(accepted);
    }, []);

    // Effect for VIP promo modal
    useEffect(() => {
        const timer = setTimeout(() => {
            setVipPromoModalOpen(true);
        }, 5000); // 5 seconds

        return () => clearTimeout(timer); // Cleanup on unmount
    }, []);

    const handleDisclaimerAccept = () => {
        setCookie('disclaimerAccepted', 'true', 365); // Set cookie for 1 year
        setIsDisclaimerAccepted(true);
    };

    const fetchCheckins = useCallback(async () => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: checkinsData, error } = await supabase
            .from('checkins')
            .select('*')
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching checkins:', error.message);
            toast.error('Could not load check-ins.');
            return;
        }

        if (!checkinsData || checkinsData.length === 0) {
            setCheckins([]);
            return;
        }

        const userIds = [...new Set(checkinsData.map(c => c.user_id).filter(Boolean))];
        let profilesMap = new Map();

        if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, is_vip, vip_until')
                .in('id', userIds as string[]);
            
            if (profilesError) {
                console.error('Error fetching profiles for checkins:', profilesError.message);
            } else if (profilesData) {
                profilesMap = new Map(profilesData.map(p => [p.id, { is_vip: p.is_vip, vip_until: p.vip_until }]));
            }
        }

        const enrichedCheckins = checkinsData.map(c => ({
            ...c,
            profiles: c.user_id ? profilesMap.get(c.user_id) || null : null,
        }));

        setCheckins(enrichedCheckins as any[]);
    }, []);

    const fetchRecentUsers = useCallback(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching recent users:', error);
        } else {
            setRecentUsers(data || []);
        }
    }, []);
    
    // Effect for automatic check-in generation
    useEffect(() => {
        const runAutoCheckinLogic = async () => {
            const AUTO_CHECKIN_KEY = 'autoCheckinState';
            const today = new Date().toISOString().split('T')[0];

            let state = {
                lastRun: '',
                dailyCount: 0,
                dailyGoal: 0,
            };

            try {
                const storedState = localStorage.getItem(AUTO_CHECKIN_KEY);
                if (storedState) {
                    state = JSON.parse(storedState);
                }
            } catch (e) {
                console.error("Failed to parse auto-checkin state from localStorage", e);
            }
            
            if (state.lastRun !== today) {
                const dailyGoal = Math.floor(Math.random() * (80 - 50 + 1)) + 50; // 50-80
                state = {
                    lastRun: today,
                    dailyCount: 0,
                    dailyGoal: dailyGoal,
                };
            }
            
            const needed = state.dailyGoal - state.dailyCount;
            if (needed <= 0) {
                return; // Daily goal met
            }
            
            const maxPerSession = Math.min(needed, Math.floor(Math.random() * 3) + 2); // 2 to 4 per session
            
            for (let i = 0; i < maxPerSession; i++) {
                const delay = (i * 10000) + (Math.random() * 15000); // 10-25 second intervals
                
                setTimeout(async () => {
                    const checkinData = generateFakeCheckin();
                    const { error } = await supabase.from('checkins').insert(checkinData as any);

                    if (!error) {
                        let currentState = state;
                        try {
                            const currentStoredState = localStorage.getItem(AUTO_CHECKIN_KEY);
                            if(currentStoredState) currentState = JSON.parse(currentStoredState);
                        } catch (e) {}

                        if (currentState.lastRun === today) {
                            currentState.dailyCount += 1;
                            localStorage.setItem(AUTO_CHECKIN_KEY, JSON.stringify(currentState));
                        }
                    } else {
                        console.error("Auto check-in creation failed:", error);
                    }
                }, delay);
            }
        };

        const initTimeout = setTimeout(runAutoCheckinLogic, 5000); // Wait 5 seconds before starting

        return () => clearTimeout(initTimeout);

    }, []);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('display_name', `%${searchQuery.trim()}%`)
                .limit(5);

            if (error) {
                console.error("Error searching users:", error);
                setSearchResults([]);
            } else {
                setSearchResults(data || []);
            }
        };

        const debouncedSearch = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debouncedSearch);
    }, [searchQuery]);

    useEffect(() => {
        fetchCheckins();
        fetchRecentUsers();
        
        const channel = supabase.channel('realtime-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
                fetchCheckins();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                fetchRecentUsers();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsCurrentUserOnline(true);
                    const presenceChannel = supabase.channel('online-users');
                    presenceChannel.on('presence', { event: 'sync' }, () => {
                        const count = Object.keys(presenceChannel.presenceState()).length;
                        setOnlineUsersCount(count);
                    }).subscribe(async (presenceStatus) => {
                        if (presenceStatus === 'SUBSCRIBED') {
                            await presenceChannel.track({ online_at: new Date().toISOString() });
                        }
                    });
                } else {
                    setIsCurrentUserOnline(false);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchCheckins, fetchRecentUsers]);

    const handleCheckInClick = () => {
        setCheckInModalOpen(true);
    };

    const handleCheckInSuccess = () => {
        setCheckInModalOpen(false);
        fetchCheckins();
    };
    
    const filteredCheckins = useMemo(() => {
        return checkins.filter(c => {
            const genderMatch = filters.gender === 'All' || c.gender === filters.gender || (filters.gender === 'Coppia' && c.status === 'Coppia');
            const cityMatch = filters.city === 'All' || c.city === filters.city;
            return genderMatch && cityMatch;
        });
    }, [checkins, filters]);
    
    const cityOptions = useMemo(() => {
        const cities = new Set(checkins.map(c => c.city).filter(Boolean));
        const options = Array.from(cities).map(city => ({ value: city as string, label: city as string }));
        return [{ value: 'All', label: 'All Cities' }, ...options];
    }, [checkins]);

    const handleRecentCheckinClick = (checkin: Checkin) => {
        setFlyToLocation([checkin.lat, checkin.lon]);
        setTimeout(() => setSelectedCheckin(checkin), 1500);
    };
    
    const handleRecentUserClick = (profile: Profile) => {
        setSelectedProfile(profile);
    };

    const handleSendMessage = (recipient: Profile) => {
        if (!user) {
            toast.error(t('toasts.loginRequired'));
            setAuthModalOpen(true);
            return;
        }
        setSelectedProfile(null);
        setMessageRecipient(recipient);
    };

    const handleUserSearchSelect = (profile: Profile) => {
        setSelectedProfile(profile);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="relative h-screen w-screen bg-gray-900 overflow-hidden">
            {!isDisclaimerAccepted && <DisclaimerModal onAccept={handleDisclaimerAccept} />}
            <Toaster position="top-center" toastOptions={{
                style: { background: '#333', color: '#fff' }
            }} />
            <Header
                onCheckInClick={handleCheckInClick}
                onAuthClick={() => setAuthModalOpen(true)}
                onDashboardClick={() => setDashboardModalOpen(true)}
                filters={filters}
                setFilters={setFilters}
                cityOptions={cityOptions}
                onlineUsersCount={onlineUsersCount}
                isCurrentUserOnline={isCurrentUserOnline}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                onUserSearchSelect={handleUserSearchSelect}
            />
            <MapView 
                checkins={filteredCheckins} 
                onMarkerClick={setSelectedCheckin}
                flyToLocation={flyToLocation}
            />

            <Guestbook />

            <div className="absolute bottom-0 left-0 right-0 z-10 hidden md:flex justify-center p-4 pointer-events-none">
                <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 pointer-events-auto w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <h3 className="text-white font-semibold mb-2 ml-1 text-sm drop-shadow-lg">{t('recentCheckins.title')}</h3>
                        <RecentCheckinsSlider 
                            checkins={checkins.slice(0, 5)} 
                            onCheckinClick={handleRecentCheckinClick} 
                        />
                    </div>
                    
                    <div className="w-4/5 h-px md:w-px md:h-32 bg-gray-700 self-center md:mt-6"></div>

                    <div className="w-full md:w-auto">
                        <h3 className="text-white font-semibold mb-2 ml-1 text-sm drop-shadow-lg">{t('recentUsers.title')}</h3>
                        <RecentUsersSlider 
                            users={recentUsers} 
                            onUserClick={handleRecentUserClick} 
                        />
                    </div>
                </div>
            </div>
            
            {isAuthModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
            {isCheckInModalOpen && <CheckInModal onClose={() => setCheckInModalOpen(false)} onSuccess={handleCheckInSuccess} />}
            {isDashboardModalOpen && <DashboardModal onClose={() => setDashboardModalOpen(false)} />}
            {selectedCheckin && <CheckinDetailModal checkin={selectedCheckin} onClose={() => setSelectedCheckin(null)} />}
            {selectedProfile && <UserProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} onSendMessage={handleSendMessage} />}
            {messageRecipient && <MessageModal recipient={messageRecipient} onClose={() => setMessageRecipient(null)} />}
            {isVipPromoModalOpen && <VipPromoModal onClose={() => setVipPromoModalOpen(false)} />}
        </div>
    );
};

export default App;
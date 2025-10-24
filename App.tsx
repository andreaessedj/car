
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import MapView from './components/MapView';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import CheckInModal from './components/CheckInModal';
import CheckinDetailModal from './components/CheckinDetailModal';
import DashboardModal from './components/DashboardModal';
import UserProfileModal from './components/UserProfileModal';
import MessageModal from './components/MessageModal';
import DisclaimerModal from './components/DisclaimerModal';
import RecentCheckinsSlider from './components/RecentCheckinsSlider';
import RecentUsersSlider from './components/RecentUsersSlider';
import Guestbook from './components/Guestbook';
import VipPromoModal from './components/VipPromoModal';
import Footer from './components/Footer';
import VenueDetailModal from './components/VenueDetailModal';
import type { Checkin, FilterState, Profile, Venue } from './types';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';
import VenueDashboard from './components/VenueDashboard';
import { useTranslation } from './i18n';

const App: React.FC = () => {
    const { t } = useTranslation();
    // Modal states
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState<Profile | null>(null);
    const [showMessageModal, setShowMessageModal] = useState<Profile | null>(null); // Kept for legacy compatibility if needed
    const [initialRecipient, setInitialRecipient] = useState<Profile | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('disclaimerAccepted'));
    const [showVipPromo, setShowVipPromo] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

    // Data states
    const [checkins, setCheckins] = useState<Checkin[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
    const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    // Filter and search states
    const [filters, setFilters] = useState<FilterState>({ gender: 'All', city: 'All', vipOnly: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);

    const { user, profile } = useAuth();
    const presenceChannel = useMemo(() => user ? supabase.channel(`online-users`, {
        config: {
            presence: {
                key: user.id,
            },
        },
    }) : null, [user]);

    const isCurrentUserOnline = useMemo(() => {
        if (!user || onlineUsers.length === 0) return false;
        return onlineUsers.some(p => p.user_id === user.id);
    }, [user, onlineUsers]);

    const fetchData = useCallback(async () => {
        const { data: checkinsData, error: checkinsError } = await supabase
            .from('checkins')
            .select('*, profiles!user_id(*)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (checkinsError) console.error('Error fetching checkins:', checkinsError);
        else setCheckins(checkinsData || []);
        
        const { data: venuesData, error: venuesError } = await supabase
            .from('venues')
            .select('*, profiles!inner(is_vip, vip_until)')
            .eq('profiles.profile_type', 'club');
        
        if (venuesError) console.error('Error fetching venues:', venuesError);
        else {
             const transformedVenues = venuesData?.map(v => ({...v, is_vip: v.profiles.is_vip, vip_until: v.profiles.vip_until, profiles: null })) || [];
             setVenues(transformedVenues as Venue[]);
        }

        const { data: recentUsersData, error: recentUsersError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .neq('profile_type', 'club')
            .limit(10);

        if (recentUsersError) {
            console.error('Error fetching recent users:', recentUsersError);
        } else {
            setRecentUsers(recentUsersData || []);
        }

        if (checkinsData) {
            const cities = ['All', ...new Set(checkinsData.map(c => c.city).filter(Boolean) as string[])];
            setCityOptions(cities.map(c => ({ value: c, label: c })));
        }
    }, []);

    useEffect(() => {
        fetchData();
        const mainChannel = supabase.channel('public-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
            .subscribe();
            
        return () => {
            supabase.removeChannel(mainChannel);
        };
    }, [fetchData]);

    useEffect(() => {
        if (!presenceChannel) return;

        const handlePresenceSync = () => {
            const newState = presenceChannel.presenceState();
            const presences = Object.keys(newState).map(key => {
                const pres = newState[key][0] as any;
                return {
                    user_id: key,
                    online_at: pres.online_at,
                };
            });
            setOnlineUsers(presences);
        };

        presenceChannel
            .on('presence', { event: 'sync' }, handlePresenceSync)
            .on('presence', { event: 'join' }, handlePresenceSync)
            .on('presence', { event: 'leave' }, handlePresenceSync)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                        user_id: user?.id
                    });
                }
            });

        return () => {
            if (presenceChannel) {
                presenceChannel.unsubscribe();
            }
        };
    }, [presenceChannel, user]);

    useEffect(() => {
        if (searchQuery.trim().length > 2) {
            const searchUsers = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('display_name', `%${searchQuery}%`)
                    .limit(5);
                if (!error) {
                    setSearchResults(data || []);
                }
            };
            const debounce = setTimeout(searchUsers, 300);
            return () => clearTimeout(debounce);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleUserSearchSelect = (profile: Profile) => {
        setShowUserProfile(profile);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSendMessage = (recipient: Profile) => {
        setShowUserProfile(null); // Close user profile if open
        setInitialRecipient(recipient);
        setShowDashboard(true);
    };

    const handleDashboardClose = () => {
        setShowDashboard(false);
        setInitialRecipient(null);
    };

    const handleDisclaimerAccept = () => {
        localStorage.setItem('disclaimerAccepted', 'true');
        setShowDisclaimer(false);
    };

    const filteredCheckins = useMemo(() => {
        return checkins.filter(c => {
            const genderMatch = filters.gender === 'All' || c.gender === filters.gender || (filters.gender === 'Coppia' && c.status === 'Coppia');
            const cityMatch = filters.city === 'All' || c.city === filters.city;
            const vipMatch = !filters.vipOnly || (c.profiles?.is_vip === true && new Date(c.profiles?.vip_until || 0) > new Date());
            return genderMatch && cityMatch && vipMatch;
        });
    }, [checkins, filters]);

    const recentCheckins = useMemo(() => checkins.slice(0, 10), [checkins]);

    return (
        <div className="h-screen w-screen bg-gray-900 text-white relative flex flex-col">
            <Toaster position="bottom-center" toastOptions={{
                className: 'bg-gray-700 text-white',
            }}/>
            
            {showDisclaimer && <DisclaimerModal onAccept={handleDisclaimerAccept} />}

            <Header 
                onCheckInClick={() => setShowCheckInModal(true)}
                onAuthClick={() => setShowAuthModal(true)}
                onDashboardClick={() => setShowDashboard(true)}
                onBecomeVipClick={() => setShowVipPromo(true)}
                filters={filters}
                setFilters={setFilters}
                cityOptions={cityOptions}
                onlineUsersCount={onlineUsers.length}
                isCurrentUserOnline={isCurrentUserOnline}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                onUserSearchSelect={handleUserSearchSelect}
            />
            
            <main className="flex-grow relative">
                <MapView
                    checkins={filteredCheckins}
                    venues={venues}
                    onCheckinClick={setSelectedCheckin}
                    onVenueClick={setSelectedVenue}
                    flyToLocation={flyToLocation}
                />
                <Guestbook />
                 <div className="absolute bottom-12 left-0 right-0 p-3 z-10 w-full lg:w-auto lg:max-w-[calc(100%-22rem)]">
                    <div className="flex flex-row space-x-4">
                        <div className="w-1/2">
                             <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">{t('recentCheckins.title')}</h3>
                            <RecentCheckinsSlider checkins={recentCheckins} onCheckinClick={setSelectedCheckin} />
                        </div>
                        <div className="w-1/2">
                             <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">{t('recentUsers.title')}</h3>
                            <RecentUsersSlider users={recentUsers} onUserClick={handleUserSearchSelect} />
                        </div>
                    </div>
                 </div>
            </main>

            <Footer />
            
            {/* Modals */}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showCheckInModal && <CheckInModal onClose={() => setShowCheckInModal(false)} onSuccess={() => { setShowCheckInModal(false); fetchData(); }} />}
            {selectedCheckin && <CheckinDetailModal checkin={selectedCheckin} onClose={() => setSelectedCheckin(null)} />}
            {selectedVenue && <VenueDetailModal venue={selectedVenue} onClose={() => setSelectedVenue(null)} />}
            {showDashboard && (
                profile?.profile_type === 'club' ? 
                <VenueDashboard onClose={handleDashboardClose} /> : 
                <DashboardModal onClose={handleDashboardClose} initialRecipient={initialRecipient} />
            )}
            {showUserProfile && <UserProfileModal profile={showUserProfile} onClose={() => setShowUserProfile(null)} onSendMessage={handleSendMessage} />}
            {showMessageModal && <MessageModal recipient={showMessageModal} onClose={() => setShowMessageModal(null)} />}
            {showVipPromo && <VipPromoModal onClose={() => setShowVipPromo(false)} />}
        </div>
    );
};

export default App;

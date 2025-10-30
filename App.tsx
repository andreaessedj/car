import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import MapView from './components/MapView';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import CheckInModal from './components/CheckInModal';
import CheckinDetailModal from './components/CheckinDetailModal';
import DashboardPanel from './components/DashboardModal';
import UserProfileModal from './components/UserProfileModal';
import MessageModal from './components/MessageModal';
import DisclaimerModal from './components/DisclaimerModal';
import RecentCheckinsSlider from './components/RecentCheckinsSlider';
import RecentUsersSlider from './components/RecentUsersSlider';
import Guestbook from './components/Guestbook';
import VipPromoModal from './components/VipPromoModal';
import Footer from './components/Footer';
import VenueDetailModal from './components/VenueDetailModal';
import type { Checkin, FilterState, Profile, Venue, Message } from './types';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';
import VenueDashboard from './components/VenueDashboard';
import { useTranslation } from './i18n';
import { ChatBubbleLeftRightIcon, UserCircleIcon } from './components/icons';

// nuovi import
import MatchBrowserModal from './components/MatchBrowserModal';
import { useHeartbeat } from './hooks/useHeartbeat';
import { generateFakeCheckin } from './services/fakeData';
import ContactModal from './components/ContactModal';

const App: React.FC = () => {
  const { t } = useTranslation();
  useHeartbeat();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<Profile | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<Profile | null>(null);
  const [initialRecipient, setInitialRecipient] = useState<Profile | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('disclaimerAccepted'));
  const [showVipPromo, setShowVipPromo] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);
  const [showMatchBrowser, setShowMatchBrowser] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ gender: 'All', city: 'All', vipOnly: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);

  const { user, profile } = useAuth();

  const presenceChannel = useMemo(
    () =>
      user
        ? supabase.channel(`online-users`, {
            config: { presence: { key: user.id } },
          })
        : null,
    [user]
  );

  const isCurrentUserOnline = useMemo(() => {
    if (!user || onlineUsers.length === 0) return false;
    return onlineUsers.some(p => p.user_id === user.id);
  }, [user, onlineUsers]);

  // --- Fetch principale ---
  const fetchData = useCallback(async () => {
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('*, profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('*, profiles!inner(is_vip, vip_until)')
      .eq('profiles.profile_type', 'club');

    const { data: recentUsersData, error: recentUsersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .neq('profile_type', 'club')
      .limit(10);

    if (checkinsError) console.error('Error fetching checkins:', checkinsError);
    if (venuesError) console.error('Error fetching venues:', venuesError);
    if (recentUsersError) console.error('Error fetching recent users:', recentUsersError);

    if (venuesData) {
      const transformedVenues = venuesData.map(v => ({
        ...v,
        is_vip: (v as any).profiles.is_vip,
        vip_until: (v as any).profiles.vip_until,
        profiles: null,
      }));
      setVenues(transformedVenues as Venue[]);
    }

    setRecentUsers(recentUsersData || []);

    const realCheckins = checkinsData || [];
    const MIN_TOTAL = 30;
    let fakeCheckins: any[] = [];
    if (realCheckins.length < MIN_TOTAL) {
      fakeCheckins = Array.from({ length: MIN_TOTAL - realCheckins.length }).map((_, idx) => ({
        ...generateFakeCheckin(),
        id: -1 * (idx + 1),
        created_at: new Date(Date.now() - idx * 5 * 60 * 1000).toISOString(),
        profiles: { is_vip: false, vip_until: null },
      }));
    }

    const combined = [...realCheckins, ...fakeCheckins];
    setCheckins(combined);

    const cities = ['All', ...new Set(combined.map(c => c.city).filter(Boolean) as string[])];
    setCityOptions(cities.map(c => ({ value: c, label: c })));
  }, []);

  useEffect(() => {
    fetchData();
    const mainChannel = supabase
      .channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(mainChannel);
  }, [fetchData]);

  // ✅ VIP Activation Flow
  useEffect(() => {
    if ((window as any).__vipHandled__) return;
    const raw = sessionStorage.getItem('vip_pending');
    if (!raw) return;

    (window as any).__vipHandled__ = true;
    console.log('[VIP] vip_pending trovato:', raw);

    let days = 30;
    try {
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed?.days) && parsed.days > 0) days = parsed.days;
    } catch {}
    sessionStorage.removeItem('vip_pending');

    const t = setTimeout(async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const authUser = sess?.session?.user;
        if (!authUser) {
          toast.error('Accedi per attivare il VIP');
          return;
        }

        const vipUntil = new Date(Date.now() + days * 86400000).toISOString();
        const { error } = await supabase
          .from('profiles')
          .update({ is_vip: true, vip_until: vipUntil })
          .eq('id', authUser.id);

        if (error) {
          console.error('[VIP] Update error:', error);
          toast.error('Errore durante attivazione VIP');
        } else {
          toast.success(`VIP attivato per ${days} giorni`);
          await fetchData();
        }
      } catch (e) {
        console.error('[VIP] Errore inatteso:', e);
        toast.error('Errore inatteso');
      }
    }, 100);

    return () => clearTimeout(t);
  }, [supabase, fetchData, toast]);

  // Anti "solo sfondo"
  useEffect(() => {
    const timer = setTimeout(() => {
      const root = document.getElementById('root');
      if (root && !root.firstChild) {
        const stamp = 'reload_once';
        if (!sessionStorage.getItem(stamp)) {
          sessionStorage.setItem(stamp, '1');
          window.location.replace('/?v=' + Date.now());
        }
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Rendering
  const filteredCheckins = useMemo(() => {
    return checkins.filter(c => {
      const genderMatch =
        filters.gender === 'All' ||
        c.gender === filters.gender ||
        (filters.gender === 'Coppia' && c.status === 'Coppia');

      const cityMatch = filters.city === 'All' || c.city === filters.city;

      const vipMatch =
        !filters.vipOnly ||
        (c.profiles?.is_vip === true && new Date(c.profiles?.vip_until || 0) > new Date());

      return genderMatch && cityMatch && vipMatch;
    });
  }, [checkins, filters]);

  const recentCheckins = useMemo(() => checkins.slice(0, 10), [checkins]);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white relative flex flex-col overflow-hidden">
      <Toaster position="bottom-center" toastOptions={{ className: 'bg-gray-700 text-white' }} />

      {showDisclaimer && <DisclaimerModal onAccept={() => { localStorage.setItem('disclaimerAccepted', 'true'); setShowDisclaimer(false); }} />}

      <Header
        onCheckInClick={() => setShowCheckInModal(true)}
        onAuthClick={() => setShowAuthModal(true)}
        onDashboardClick={() => setShowDashboard(true)}
        onBecomeVipClick={() => setShowVipPromo(true)}
        onMatchClick={() => setShowMatchBrowser(true)}
        filters={filters}
        setFilters={setFilters}
        cityOptions={cityOptions}
        onlineUsersCount={onlineUsers.length}
        isCurrentUserOnline={isCurrentUserOnline}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onUserSearchSelect={p => { setShowUserProfile(p); setSearchQuery(''); setSearchResults([]); }}
      />

      <main className="flex-grow relative">
        <MapView
          checkins={filteredCheckins}
          venues={venues}
          onCheckinClick={setSelectedCheckin}
          onVenueClick={setSelectedVenue}
          flyToLocation={flyToLocation}
        />

        <div className="hidden lg:block">
          <Guestbook isOpen={true} />
        </div>

        <button
          onClick={() => setIsGuestbookOpen(true)}
          className="lg:hidden fixed bottom-28 right-4 z-20 bg-red-600 p-3 rounded-full shadow-lg text-white"
          aria-label={t('guestbook.title')}
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>

        <Guestbook isOpen={isGuestbookOpen} onClose={() => setIsGuestbookOpen(false)} isMobile={true} />

        <div className="absolute bottom-12 left-0 right-0 p-3 z-10 w-full lg:w-auto lg:max-w-full">
          <div className="flex flex-row space-x-4">
            <div className="w-1/2">
              <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">{t('recentCheckins.title')}</h3>
              <RecentCheckinsSlider checkins={recentCheckins} onCheckinClick={setSelectedCheckin} />
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">{t('recentUsers.title')}</h3>
              <RecentUsersSlider users={recentUsers} onUserClick={setShowUserProfile} />
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenContact={() => setShowContact(true)} />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showCheckInModal && <CheckInModal onClose={() => setShowCheckInModal(false)} onSuccess={fetchData} />}
      {selectedCheckin && <CheckinDetailModal checkin={selectedCheckin} onClose={() => setSelectedCheckin(null)} />}
      {selectedVenue && <VenueDetailModal venue={selectedVenue} onClose={() => setSelectedVenue(null)} />}
      {profile?.profile_type === 'club'
        ? showDashboard && <VenueDashboard onClose={() => setShowDashboard(false)} />
        : <DashboardPanel isOpen={showDashboard} onClose={() => setShowDashboard(false)} initialRecipient={initialRecipient} presenceChannel={presenceChannel} onlineUsers={onlineUsers} />
      }
      {showUserProfile && <UserProfileModal profile={showUserProfile} onClose={() => setShowUserProfile(null)} onSendMessage={r => { setShowUserProfile(null); setInitialRecipient(r); setShowDashboard(true); }} />}
      {showMessageModal && <MessageModal recipient={showMessageModal} onClose={() => setShowMessageModal(null)} />}
      {showVipPromo && <VipPromoModal onClose={() => setShowVipPromo(false)} />}
      {showMatchBrowser && <MatchBrowserModal isOpen={showMatchBrowser} onClose={() => setShowMatchBrowser(false)} />}
      {showContact && <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />}
    </div>
  );
};

export default App;

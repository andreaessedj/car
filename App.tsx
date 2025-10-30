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

// nuovi import step 3
import MatchBrowserModal from './components/MatchBrowserModal';
import { useHeartbeat } from './hooks/useHeartbeat';

// nuovo import per i fake check-in
import { generateFakeCheckin } from './services/fakeData';

// nuovo import per Contatti
import ContactModal from './components/ContactModal';

const App: React.FC = () => {
  const { t } = useTranslation();

  // heartbeat: aggiorna profiles.last_active dell'utente loggato
  useHeartbeat();

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<Profile | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<Profile | null>(null); // legacy compat
  const [initialRecipient, setInitialRecipient] = useState<Profile | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('disclaimerAccepted'));
  const [showVipPromo, setShowVipPromo] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);

  // pannello "Match"
  const [showMatchBrowser, setShowMatchBrowser] = useState(false);

  // pannello "Contatti"
  const [showContact, setShowContact] = useState(false);

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

  // canale presence realtime
  const presenceChannel = useMemo(
    () =>
      user
        ? supabase.channel(`online-users`, {
            config: {
              presence: {
                key: user.id,
              },
            },
          })
        : null,
    [user]
  );

  // stato online per l'utente corrente
  const isCurrentUserOnline = useMemo(() => {
    if (!user || onlineUsers.length === 0) return false;
    return onlineUsers.some(p => p.user_id === user.id);
  }, [user, onlineUsers]);

  // --- fetchData AGGIORNATO CON FAKE CHECK-IN ---
  const fetchData = useCallback(async () => {
    // 1. check-ins reali
    const { data: checkinsData, error: checkinsError } = await supabase
      .from('checkins')
      .select('*, profiles!user_id(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. venues reali
    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('*, profiles!inner(is_vip, vip_until)')
      .eq('profiles.profile_type', 'club');

    // 3. utenti recenti reali
    const { data: recentUsersData, error: recentUsersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .neq('profile_type', 'club')
      .limit(10);

    if (checkinsError) console.error('Error fetching checkins:', checkinsError);
    if (venuesError) console.error('Error fetching venues:', venuesError);
    if (recentUsersError) console.error('Error fetching recent users:', recentUsersError);

    // venues trasformati (aggiungiamo is_vip, vip_until nel root oggetto Venue)
    if (!venuesError && venuesData) {
      const transformedVenues =
        venuesData.map(v => ({
          ...v,
          is_vip: (v as any).profiles.is_vip,
          vip_until: (v as any).profiles.vip_until,
          profiles: null,
        })) || [];
      setVenues(transformedVenues as Venue[]);
    }

    // utenti recenti
    if (!recentUsersError) {
      setRecentUsers(recentUsersData || []);
    }

    // --- FAKE CHECKINS LOGIC ---
    const realCheckins = checkinsData || [];
    const MIN_TOTAL = 30; // minimo di check-in da mostrare

    let fakeCheckins: any[] = [];
    if (realCheckins.length < MIN_TOTAL) {
      const howMany = MIN_TOTAL - realCheckins.length;

      fakeCheckins = Array.from({ length: howMany }).map((_, idx) => {
        const base = generateFakeCheckin();

        return {
          ...base,
          // id fittizio negativo per non collidere con PK reali
          id: -1 * (idx + 1),
          // timestamp finto (scalato di 5 minuti a ritroso)
          created_at: new Date(Date.now() - idx * 5 * 60 * 1000).toISOString(),
          // struttura "profiles" simile alla query reale (per VIP badge ecc.)
          profiles: {
            is_vip: false,
            vip_until: null,
          },
        };
      });
    }

    const combinedCheckins: any[] = [...realCheckins, ...fakeCheckins];

    // aggiorna stato checkins
    setCheckins(combinedCheckins as Checkin[]);

    // aggiorna cityOptions in base ai check-in combinati
    const cities = [
      'All',
      ...new Set(
        combinedCheckins.map(c => c.city).filter(Boolean) as string[]
      ),
    ];
    setCityOptions(cities.map(c => ({ value: c, label: c })));
  }, []);

  // primo load + realtime per checkins, venues, profiles
  useEffect(() => {
    fetchData();
    const mainChannel = supabase
      .channel('public-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins' },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venues' },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mainChannel);
    };
  }, [fetchData]);

  // realtime messaggi in arrivo → toast + apertura chat se clicchi
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (payload: { new: Message }) => {
      const newMessage = payload.new;

      // se sto già chattando con chi mi scrive e la dashboard è aperta, niente toast
      const isChattingWithSender =
        initialRecipient?.id === newMessage.sender_id &&
        showDashboard;

      if (!isChattingWithSender) {
        const openChat = () => {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()
            .then(({ data }) => {
              if (data) {
                setInitialRecipient(data);
                setShowDashboard(true);
                toast.dismiss(newMessage.id.toString());
              }
            });
        };

        toast.custom(
          tEl => (
            <div
              onClick={openChat}
              className={`${
                tEl.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-white">
                      {t('dashboard.newMessageFrom')}{' '}
                      {newMessage.sender
                        ?.display_name || '...'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 truncate">
                      {newMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
          { id: newMessage.id.toString() }
        );
      }
    };

    const messagesChannel = supabase
      .channel(`public:messages:receiver_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        payload => handleNewMessage(payload as any)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, showDashboard, initialRecipient, t]);

  // presenza online / typing realtime
  useEffect(() => {
    if (!presenceChannel) return;

    const handlePresenceSync = () => {
      const newState = presenceChannel.presenceState();
      const presences = Object.keys(newState).map(key => {
        const pres = newState[key][0] as any;
        return {
          user_id: key,
          online_at: pres.online_at,
          typing: pres.typing || false,
        };
      });
      setOnlineUsers(presences);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, handlePresenceSync)
      .on('presence', { event: 'leave' }, handlePresenceSync)
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: user?.id,
          });
        }
      });

    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [presenceChannel, user]);

  // live search utenti
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

  // Applica filtri (gender/city/VIP) sui check-in combinati
  const filteredCheckins = useMemo(() => {
    return checkins.filter(c => {
      const genderMatch =
        filters.gender === 'All' ||
        c.gender === filters.gender ||
        (filters.gender === 'Coppia' && c.status === 'Coppia');

      const cityMatch =
        filters.city === 'All' || c.city === filters.city;

      const vipMatch =
        !filters.vipOnly ||
        (c.profiles?.is_vip === true &&
          new Date(c.profiles?.vip_until || 0) > new Date());

      return genderMatch && cityMatch && vipMatch;
    });
  }, [checkins, filters]);

  // slider ultimi check-in reali+fake (primi 10 dopo ordinamento fatto in fetchData)
  const recentCheckins = useMemo(() => checkins.slice(0, 10), [checkins]);

  /**
   * ✅ AUTO-ATTIVAZIONE VIP al rientro da BuyMeACoffee
   * URL atteso: /?vip=1&days=30
   * - aggiorna 'profiles' (is_vip, vip_until) per l'utente loggato
   * - mostra un toast
   * - ricarica i dati
   * - pulisce l'URL (senza refresh)
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromVip = params.get('vip') === '1';
    if (!fromVip) return;

    const daysParam = params.get('days');
    const days = Number.isFinite(Number(daysParam)) ? parseInt(daysParam!, 10) : 30;

    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          toast.error(t('common.loginRequired') || 'Accedi per attivare il VIP');
          return;
        }

        const now = new Date();
        const vipUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

        // Aggiorno la tabella 'profiles' (coerente col resto dell'app)
        const { error } = await supabase
          .from('profiles')
          .update({ is_vip: true, vip_until: vipUntil })
          .eq('id', authUser.id);

        if (error) {
          console.error(error);
          toast.error(t('common.error') || 'Errore durante attivazione VIP');
        } else {
          toast.success(t('vip.activated') || `VIP attivato per ${days} giorni`);
          fetchData();
        }
      } catch (e) {
        console.error(e);
        toast.error(t('common.error') || 'Errore inatteso');
      } finally {
        // pulisce l'URL senza ricaricare
        history.replaceState(null, '', window.location.pathname);
      }
    })();
  }, [t, fetchData]);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white relative flex flex-col overflow-hidden">
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'bg-gray-700 text-white',
        }}
      />

      {showDisclaimer && (
        <DisclaimerModal onAccept={handleDisclaimerAccept} />
      )}

      <Header
        onCheckInClick={() => setShowCheckInModal(true)}
        onAuthClick={() => setShowAuthModal(true)}
        onDashboardClick={() => setShowDashboard(true)}
        onBecomeVipClick={() => setShowVipPromo(true)}
        // nuovo: bottone Match nell'header
        onMatchClick={() => setShowMatchBrowser(true)}
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

        {/* Guestbook fisso su desktop */}
        <div className="hidden lg:block">
          <Guestbook isOpen={true} />
        </div>

        {/* Floating button guestbook su mobile */}
        <button
          onClick={() => setIsGuestbookOpen(true)}
          className="lg:hidden fixed bottom-28 right-4 z-20 bg-red-600 p-3 rounded-full shadow-lg text-white"
          aria-label={t('guestbook.title')}
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>

        <Guestbook
          isOpen={isGuestbookOpen}
          onClose={() => setIsGuestbookOpen(false)}
          isMobile={true}
        />

        {/* sliders in basso */}
        <div className="absolute bottom-12 left-0 right-0 p-3 z-10 w-full lg:w-auto lg:max-w-full">
          <div className="flex flex-row space-x-4">
            <div className="w-1/2">
              <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">
                {t('recentCheckins.title')}
              </h3>
              <RecentCheckinsSlider
                checkins={recentCheckins}
                onCheckinClick={setSelectedCheckin}
              />
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-semibold text-red-400 mb-1 px-1 tracking-wide">
                {t('recentUsers.title')}
              </h3>
              <RecentUsersSlider
                users={recentUsers}
                onUserClick={setShowUserProfile}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenContact={() => setShowContact(true)} />

      {/* Modals & Panels */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false);
            fetchData();
          }}
        />
      )}

      {selectedCheckin && (
        <CheckinDetailModal
          checkin={selectedCheckin}
          onClose={() => setSelectedCheckin(null)}
        />
      )}

      {selectedVenue && (
        <VenueDetailModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {profile?.profile_type === 'club' ? (
        showDashboard && <VenueDashboard onClose={handleDashboardClose} />
      ) : (
        <DashboardPanel
          isOpen={showDashboard}
          onClose={handleDashboardClose}
          initialRecipient={initialRecipient}
          presenceChannel={presenceChannel}
          onlineUsers={onlineUsers}
        />
      )}

      {showUserProfile && (
        <UserProfileModal
          profile={showUserProfile}
          onClose={() => setShowUserProfile(null)}
          onSendMessage={handleSendMessage}
        />
      )}

      {showMessageModal && (
        <MessageModal
          recipient={showMessageModal}
          onClose={() => setShowMessageModal(null)}
        />
      )}

      {showVipPromo && (
        <VipPromoModal onClose={() => setShowVipPromo(false)} />
      )}

      {/* Modal Match */}
      {showMatchBrowser && (
        <MatchBrowserModal
          isOpen={showMatchBrowser}
          onClose={() => setShowMatchBrowser(false)}
        />
      )}

      {/* Modal Contatti */}
      {showContact && (
        <ContactModal
          isOpen={showContact}
          onClose={() => setShowContact(false)}
        />
      )}
    </div>
  );
};

export default App;

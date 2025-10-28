import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { XMarkIcon, UserCircleIcon, BuildingOffice2Icon, ArrowLeftIcon } from './icons';
import { useTranslation } from '../i18n';
import { MapContainer, TileLayer, useMapEvents, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

interface AuthModalProps {
    onClose: () => void;
}

// Define the marker icon using SVG string to avoid dependency on react-dom/server
const markerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#ef4444" style="width: 48px; height: 48px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
  <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.61-.473a10.764 10.764 0 002.639-2.288 10.94 10.94 0 002.084-3.555A9.006 9.006 0 0017 8c0-4.418-4.03-8-9-8S-2 3.582-2 8c0 1.566.447 3.033 1.232 4.291.845 1.328 1.902 2.525 3.088 3.555a10.94 10.94 0 002.084 2.288 10.764 10.764 0 002.639 1.473c.21.203.424.373.61.473.097.07.193.12.28.14l.018.008.006.003zM10 11.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z" clip-rule="evenodd" />
</svg>`;

const selectionMarkerIcon = new L.DivIcon({
    html: markerIconSvg,
    className: 'bg-transparent border-0',
    iconSize: [48, 48],
    iconAnchor: [24, 48], // Point of the icon (bottom center)
});

// Helper component to handle map click events
const MapEvents: React.FC<{ onLocationSelect: (latlng: L.LatLng) => void }> = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

// Helper to control map view when location changes
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Helper component to invalidate map size when it becomes visible
const InvalidateMapSize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        // Delay needed to ensure the modal is fully rendered and visible.
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
    const [registrationStep, setRegistrationStep] = useState<'selection' | 'form'>('selection');
    const [profileType, setProfileType] = useState<'user' | 'venue' | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // Used for user's name or venue's name
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    // Venue specific state
    const [address, setAddress] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [openingHours, setOpeningHours] = useState<Record<string, string>>(
        WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day]: '' }), {})
    );
    const geocodeTimeoutRef = useRef<number | null>(null);

    // Geocoding effect
    useEffect(() => {
        if (profileType !== 'venue' || address.trim().length < 5) {
            return;
        }

        if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current);
        }

        geocodeTimeoutRef.current = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=it&limit=1`);
                if (!response.ok) throw new Error('Geocoding failed');
                const data = await response.json();
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
                }
            } catch (e) {
                console.error("Geocoding error:", e);
            }
        }, 1000);

        return () => {
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
            }
        };
    }, [address, profileType]);

    const resetFormFields = useCallback(() => {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setGender('');
        setBio('');
        setAddress('');
        setLogoUrl('');
        setLocation(null);
        setOpeningHours(WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day]: '' }), {}));
    }, []);
    
    const handleSetView = (newView: 'login' | 'register') => {
        setView(newView);
        // Reset registration flow when switching views
        if (newView === 'register') {
            setRegistrationStep('selection');
            setProfileType(null);
            resetFormFields();
        }
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (view === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success(t('auth.loginSuccess'));
                onClose();
            }
        } else if (view === 'register') {
             if (!profileType) return; // Should not happen
            if (displayName.trim() === '') {
                toast.error(t(profileType === 'user' ? 'auth.displayNameRequired' : 'auth.venueNameRequired'));
                setLoading(false);
                return;
            }
            if (profileType === 'user') {
                if (gender.trim() === '') {
                    toast.error(t('auth.genderRequired'));
                    setLoading(false);
                    return;
                }
                if (bio.trim() === '') {
                    toast.error(t('auth.bioRequired'));
                    setLoading(false);
                    return;
                }
            }
             if (profileType === 'venue') {
                if (!location) {
                    toast.error(t('auth.locationRequired'));
                    setLoading(false);
                    return;
                }
            }


            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName.trim(),
                        profile_type: profileType === 'venue' ? 'club' : 'user',
                        // User-specific data
                        ...(profileType === 'user' && {
                            gender: gender,
                            bio: bio.trim(),
                        })
                    }
                }
            });
            if (error) {
                toast.error(error.message);
            } else if (data.user?.identities?.length === 0) {
                 toast.error(t('auth.userExists'));
            } else {
                 if (profileType === 'venue' && data.user) {
                    const { error: venueError } = await supabase.from('venues').insert({
                        id: data.user.id,
                        name: displayName.trim(),
                        description: bio.trim(),
                        address: address.trim(),
                        lat: location!.lat,
                        lon: location!.lon,
                        opening_hours: openingHours,
                        logo_url: logoUrl.trim() || null,
                    });

                    if (venueError) {
                        toast.error(t('auth.venueCreationError'));
                        console.error("Venue creation failed after signup:", venueError);
                    }
                }
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert(
                            {
                                id: data.user.id,
                                display_name: displayName.trim(),
                                bio: bio.trim() || null,
                                gender: profileType === 'user' ? gender : null,
                                profile_type: profileType === 'venue' ? 'club' : 'user',
                            },
                            { onConflict: 'id' }
                        );
                if (profileError) {
                    console.error('Profile upsert error:', profileError);
                    toast.error('Errore salvataggio profilo'); // puoi metterlo in i18n se vuoi
                }
            }    
                toast.success(t('auth.registerSuccess'));
                onClose();
            }
        }
        setLoading(false);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) {
            toast.error(t('auth.resetError'));
        } else {
            toast.success(t('auth.resetSuccess'));
            setView('login');
        }
        setLoading(false);
    };

    const handleLocationSelect = useCallback((latlng: L.LatLng) => {
        setLocation({ lat: latlng.lat, lon: latlng.lng });
    }, []);

    const handleHoursChange = (day: string, value: string) => {
        setOpeningHours(prev => ({ ...prev, [day]: value }));
    };
    
    const renderRegistrationSelection = () => (
        <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('auth.chooseAccountType')}</h2>
            <p className="text-gray-400 text-center mb-6">{t('auth.chooseAccountTypeSubtitle')}</p>
            <div className="space-y-4">
                <button
                    onClick={() => { setProfileType('user'); setRegistrationStep('form'); }}
                    className="w-full text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-start gap-4"
                >
                    <UserCircleIcon className="h-8 w-8 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-white">{t('auth.privateUser')}</h3>
                        <p className="text-sm text-gray-300">{t('auth.privateUserDescription')}</p>
                    </div>
                </button>
                 <button
                    onClick={() => { setProfileType('venue'); setRegistrationStep('form'); }}
                    className="w-full text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-start gap-4"
                >
                    <BuildingOffice2Icon className="h-8 w-8 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-white">{t('auth.venue')}</h3>
                        <p className="text-sm text-gray-300">{t('auth.venueDescription')}</p>
                    </div>
                </button>
            </div>
        </>
    );
    
    const renderRegistrationForm = () => (
         <>
            <button 
                onClick={() => { setRegistrationStep('selection'); resetFormFields(); }} 
                className="flex items-center gap-2 text-sm text-red-400 hover:underline mb-4"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('auth.back')}
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">{t(profileType === 'user' ? 'auth.createAccountUser' : 'auth.createAccountVenue')}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
                {profileType === 'user' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-1">{t('auth.displayName')}</label>
                                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">{t('auth.gender')}</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                                    <option value="">{t('checkinModal.select')}</option>
                                    <option value="M">{t('genders.M')}</option>
                                    <option value="F">{t('genders.F')}</option>
                                    <option value="Trav">{t('genders.Trav')}</option>
                                    <option value="Trans">{t('genders.Trans')}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-1">{t('auth.bio')}</label>
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder={t('auth.bioPlaceholder')} required />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-gray-300 mb-1">{t('auth.venueName')}</label>
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder={t('auth.venueNamePlaceholder')} required />
                        </div>
                         <div>
                            <label className="block text-gray-300 mb-1">{t('auth.venueDescriptionLabel')}</label>
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder={t('auth.venueDescriptionPlaceholder')} />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-1">{t('auth.venueAddressLabel')}</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder={t('auth.venueAddressPlaceholder')} />
                        </div>
                         <div>
                            <label className="block text-gray-300 mb-1">{t('auth.venueLogoLabel')}</label>
                            <input type="url" placeholder={t('auth.venueLogoPlaceholder')} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-gray-300">{t('auth.venueLocationLabel')}</label>
                            <div className="h-64 rounded-md overflow-hidden z-0 border-2 border-gray-700 relative">
                                <MapContainer center={location ? [location.lat, location.lon] : [41.902782, 12.496366]} zoom={location ? 15 : 6} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    <MapEvents onLocationSelect={handleLocationSelect} />
                                    {location && <Marker position={[location.lat, location.lon]} icon={selectionMarkerIcon} />}
                                    <MapViewController center={location ? [location.lat, location.lon] : [41.902782, 12.496366]} zoom={location ? 15 : 6} />
                                    <InvalidateMapSize />
                                </MapContainer>
                            </div>
                            {location && <p className="text-green-400 text-sm">Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}</p>}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white pt-2">{t('auth.venueOpeningHoursLabel')}</h3>
                            {WEEK_DAYS.map(day => (
                                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-gray-300 capitalize text-sm">{t(`auth.venueDays.${day}`)}</label>
                                    <input 
                                        type="text"
                                        placeholder={t('auth.venueHoursPlaceholder')}
                                        value={openingHours[day]}
                                        onChange={(e) => handleHoursChange(day, e.target.value)}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md col-span-2 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                <div>
                    <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
                <div>
                    <label className="block text-gray-300 mb-1">{t('auth.password')}</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                    {loading ? t('auth.processing') : t('auth.register')}
                </button>
            </form>
         </>
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="p-6 flex-shrink-0">
                    {view !== 'forgotPassword' && (
                        <div className="flex border-b border-gray-600 mb-4">
                            <button onClick={() => handleSetView('login')} className={`flex-1 py-2 text-center font-semibold ${view === 'login' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.login')}</button>
                            <button onClick={() => handleSetView('register')} className={`flex-1 py-2 text-center font-semibold ${view === 'register' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.register')}</button>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 flex-grow overflow-y-auto custom-scrollbar">
                    {view === 'login' && (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('auth.welcomeBack')}</h2>
                            <form onSubmit={handleAuth} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-1">{t('auth.password')}</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                </div>
                                <div className="text-right -mt-2 mb-2">
                                    <button type="button" onClick={() => setView('forgotPassword')} className="text-sm text-red-400 hover:underline">
                                        {t('auth.forgotPassword')}
                                    </button>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                                    {loading ? t('auth.processing') : t('auth.login')}
                                </button>
                            </form>
                        </>
                    )}
                    
                    {view === 'register' && (
                        registrationStep === 'selection' ? renderRegistrationSelection() : renderRegistrationForm()
                    )}
                
                    {view === 'forgotPassword' && (
                         <>
                            <h2 className="text-2xl font-bold text-white mb-4">{t('auth.resetPasswordTitle')}</h2>
                            <p className="text-gray-300 mb-4">{t('auth.resetPasswordInstructions')}</p>
                            <form onSubmit={handlePasswordReset}>
                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                                    {loading ? t('auth.processing') : t('auth.sendResetLink')}
                                </button>
                            </form>
                            <div className="text-center mt-4">
                                <button type="button" onClick={() => setView('login')} className="text-sm text-red-400 hover:underline">
                                    {t('auth.backToLogin')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from './icons';
import { useTranslation } from '../i18n';
import { MapContainer, TileLayer, useMapEvents, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

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


interface CheckInModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

// Helper component to handle map click events
const MapEvents: React.FC<{ onLocationSelect: (latlng: L.LatLng) => void }> = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

// Helper component to invalidate map size when it becomes visible
const InvalidateMapSize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};


const CheckInModal: React.FC<CheckInModalProps> = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [nickname, setNickname] = useState('Anonimo');
    const [description, setDescription] = useState('');
    const [gender, setGender] = useState('');
    const [status, setStatus] = useState<'Single' | 'Coppia'>('Single');
    const [photo, setPhoto] = useState<File | null>(null);
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [detectedCity, setDetectedCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(true);
    const [locationError, setLocationError] = useState('');
    const geocodeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (profile) {
            setNickname(profile.display_name);
            setGender(profile.gender || '');
            setStatus(profile.status || 'Single');
        } else {
             setNickname('Anonimo');
        }
    }, [profile]);
    
     const reverseGeocode = useCallback(async (lat: number, lon: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.state || 'Unknown';
            setDetectedCity(city);
        } catch (e) {
            console.error("Error fetching city", e);
            setDetectedCity("Could not determine city");
        }
    }, []);

    useEffect(() => {
        if (location) {
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
            }
            geocodeTimeoutRef.current = window.setTimeout(() => {
                reverseGeocode(location.lat, location.lon);
            }, 500); // 500ms debounce
        }
        return () => {
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
            }
        };
    }, [location, reverseGeocode]);


    const getLocation = useCallback(() => {
        setIsLocating(true);
        setLocationError('');
        const defaultLocation = { lat: 41.902782, lon: 12.496366 }; // Rome fallback

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude: lat, longitude: lon } = position.coords;
                    setLocation({ lat, lon });
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLocationError(t('checkinModal.locationError'));
                    setLocation(defaultLocation);
                    setIsLocating(false);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setLocation(defaultLocation);
            setIsLocating(false);
        }
    }, [t]);

    useEffect(() => {
        getLocation();
    }, [getLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location) {
            toast.error(t('checkinModal.locationRequired'));
            return;
        }
        setLoading(true);

        try {
            let photoUrl: string | null = null;
            if (photo) {
                const filePath = `public/${user?.id || 'anonymous'}/${Date.now()}-${photo.name}`;
                const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, photo);
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
                photoUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase.from('checkins').insert({
                nickname,
                description,
                lat: location.lat,
                lon: location.lon,
                city: detectedCity,
                photo: photoUrl,
                gender: gender || null,
                status,
                user_id: user?.id || null,
                display_name: nickname
            });

            if (insertError) throw insertError;

            onSuccess();
        } catch (error: any) {
            console.error("Check-in error:", error);
            toast.error(error.message || "Failed to create check-in.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleLocationSelect = useCallback((latlng: L.LatLng) => {
        setLocation({ lat: latlng.lat, lon: latlng.lng });
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">{t('checkinModal.title')}</h2>
                
                {isLocating && <p className="text-yellow-400 mb-4 animate-pulse">{t('checkinModal.acquiringLocation')}</p>}
                {locationError && <div className="text-red-400 mb-4 bg-red-900 bg-opacity-50 p-3 rounded-md">
                    <p>{locationError}</p>
                    <button onClick={getLocation} className="text-sm mt-2 underline">{t('checkinModal.tryAgain')}</button>
                </div>}
                {!isLocating && detectedCity && <p className="text-green-400 mb-4 font-semibold">{t('checkinModal.locationFound', { city: detectedCity })}</p>}

                 {location && (
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2">{t('checkinModal.adjustLocationMap')}</label>
                        <div className="h-64 rounded-md overflow-hidden z-0 border-2 border-gray-700 relative">
                            <MapContainer center={[location.lat, location.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                <MapEvents onLocationSelect={handleLocationSelect} />
                                <Marker position={[location.lat, location.lon]} icon={selectionMarkerIcon} />
                                <InvalidateMapSize />
                            </MapContainer>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-1">{t('checkinModal.nickname')}</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">{t('checkinModal.description')}</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-1">{t('checkinModal.gender')}</label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="">{t('checkinModal.select')}</option>
                                <option value="M">M</option>
                                <option value="F">F</option>
                                <option value="Trav">Trav</option>
                                <option value="Trans">Trans</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-1">{t('checkinModal.status')}</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as 'Single' | 'Coppia')} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="Single">{t('checkinModal.single')}</option>
                                <option value="Coppia">{t('checkinModal.couple')}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">{t('checkinModal.photoOptional')}</label>
                        <input type="file" onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)} accept="image/*" className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700" />
                    </div>
                    
                    <button type="submit" disabled={loading || isLocating || !location} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {loading ? t('checkinModal.creating') : t('checkinModal.checkinNow')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CheckInModal;
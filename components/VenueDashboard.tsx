
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import type { Venue, Event } from '../types';
import { XMarkIcon, ArrowLeftIcon } from './icons';
import { useTranslation } from '../i18n';
import DeleteAccountModal from './DeleteAccountModal';
import { MapContainer, TileLayer, useMapEvents, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

interface VenueDashboardProps {
    onClose: () => void;
}

type Tab = 'details' | 'events';

// --- Reusable Map Components (from AuthModal) ---
const markerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#ef4444" style="width: 48px; height: 48px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.61-.473a10.764 10.764 0 002.639-2.288 10.94 10.94 0 002.084-3.555A9.006 9.006 0 0017 8c0-4.418-4.03-8-9-8S-2 3.582-2 8c0 1.566.447 3.033 1.232 4.291.845 1.328 1.902 2.525 3.088 3.555a10.94 10.94 0 002.084 2.288 10.764 10.764 0 002.639 1.473c.21.203.424.373.61.473.097.07.193.12.28.14l.018.008.006.003zM10 11.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z" clip-rule="evenodd" /></svg>`;
const selectionMarkerIcon = new L.DivIcon({ html: markerIconSvg, className: 'bg-transparent border-0', iconSize: [48, 48], iconAnchor: [24, 48] });
const MapEvents: React.FC<{ onLocationSelect: (latlng: L.LatLng) => void }> = ({ onLocationSelect }) => {
    useMapEvents({ click: (e) => onLocationSelect(e.latlng) });
    return null;
};
const InvalidateMapSize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 200);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// --- Sub-components for Clarity ---

const VenueDetailsEditor: React.FC<{ venue: Venue, onUpdate: () => void, onDeleteClick: () => void }> = ({ venue, onUpdate, onDeleteClick }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(venue.name);
    const [description, setDescription] = useState(venue.description || '');
    const [address, setAddress] = useState(venue.address || '');
    const [logoUrl, setLogoUrl] = useState(venue.logo_url || '');
    const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: venue.lat, lon: venue.lon });
    const [openingHours, setOpeningHours] = useState<Record<string, string>>(
        (venue.opening_hours as Record<string, string>) || WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day]: '' }), {})
    );
    const [loading, setLoading] = useState(false);
    const geocodeTimeoutRef = useRef<number | null>(null);

     useEffect(() => {
        if (address.trim().length < 5) return;
        if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
        geocodeTimeoutRef.current = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=it&limit=1`);
                if (!response.ok) throw new Error('Geocoding failed');
                const data = await response.json();
                if (data && data.length > 0) {
                    setLocation({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                }
            } catch (e) { console.error("Geocoding error:", e); }
        }, 1000);
        return () => { if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current); };
    }, [address]);

    const handleHoursChange = (day: string, value: string) => {
        setOpeningHours(prev => ({ ...prev, [day]: value }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('venues').update({
            name,
            description,
            address,
            logo_url: logoUrl,
            lat: location.lat,
            lon: location.lon,
            opening_hours: openingHours
        }).eq('id', venue.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Dettagli del locale aggiornati!");
            onUpdate();
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleUpdate} className="space-y-4">
             <div>
                <label className="block text-gray-300 mb-1">{t('auth.venueName')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md" required />
            </div>
            <div>
                <label className="block text-gray-300 mb-1">{t('auth.venueDescriptionLabel')}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md" />
            </div>
             <div>
                <label className="block text-gray-300 mb-1">{t('auth.venueAddressLabel')}</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md" />
            </div>
             <div>
                <label className="block text-gray-300 mb-1">{t('auth.venueLogoLabel')}</label>
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md" />
            </div>
            <div className="space-y-2">
                <label className="block text-gray-300">{t('auth.venueLocationLabel')}</label>
                <div className="h-64 rounded-md overflow-hidden z-0 border-2 border-gray-700 relative">
                    <MapContainer center={[location.lat, location.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <MapEvents onLocationSelect={(latlng) => setLocation({ lat: latlng.lat, lon: latlng.lng })} />
                        <Marker position={[location.lat, location.lon]} icon={selectionMarkerIcon} />
                        <InvalidateMapSize />
                    </MapContainer>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white pt-2">{t('auth.venueOpeningHoursLabel')}</h3>
                {WEEK_DAYS.map(day => (
                    <div key={day} className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-300 capitalize text-sm">{t(`auth.venueDays.${day}`)}</label>
                        <input type="text" placeholder={t('auth.venueHoursPlaceholder')} value={openingHours[day] || ''} onChange={(e) => handleHoursChange(day, e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md col-span-2 text-sm"/>
                    </div>
                ))}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500">
                {loading ? t('dashboard.saving') : t('dashboard.saveChanges')}
            </button>
            <div className="pt-6 mt-6 border-t border-gray-700 text-center">
                <h3 className="font-semibold text-red-500">{t('venueDashboard.dangerZoneTitle')}</h3>
                <p className="text-xs text-gray-400 mb-2">{t('venueDashboard.dangerZoneDescription')}</p>
                <button type="button" onClick={onDeleteClick} className="text-sm text-red-500 hover:underline bg-red-900/50 px-3 py-1 rounded-md">
                    {t('venueDashboard.deleteVenueAccount')}
                </button>
            </div>
        </form>
    );
};


const VenueScheduleManager: React.FC<{ venue: Venue, onDataChange: () => void }> = ({ venue, onDataChange }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null);
    const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });
    
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const weekStartString = weekStartDate.toISOString().split('T')[0];
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        
        const { data, error } = await supabase.from('events').select('*')
            .eq('venue_id', venue.id)
            .gte('event_date', weekStartString)
            .lte('event_date', weekEndDate.toISOString().split('T')[0]);

        if (error) toast.error(error.message);
        else setEvents(data || []);
        setLoading(false);
    }, [venue.id, weekStartDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSaveEvent = async (eventData: Partial<Event>) => {
        const eventToSave = { ...eventData, venue_id: venue.id };
        const { error } = await supabase.from('events').upsert(eventToSave, { onConflict: 'id' });
        if (error) { toast.error(error.message); } 
        else {
            toast.success("Evento salvato!");
            setCurrentEvent(null);
            fetchEvents();
            onDataChange();
        }
    };
    
    const handleDeleteEvent = async (eventId: number) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo evento?")) return;
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) { toast.error(error.message); } 
        else {
            toast.success("Evento eliminato.");
            fetchEvents();
            onDataChange();
        }
    };

    const handleEditEvent = (day: Date) => {
        const existingEvent = events.find(e => e.event_date === day.toISOString().split('T')[0]);
        setCurrentEvent(existingEvent || { event_date: day.toISOString().split('T')[0], title: '', description: '' });
    };

    const handleWeekChange = (direction: 'prev' | 'next') => {
        setWeekStartDate(current => {
            const newDate = new Date(current);
            newDate.setDate(current.getDate() + (direction === 'prev' ? -7 : 7));
            return newDate;
        });
    };

    const getWeekStatus = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekStartDate.getDate() + 6);
        
        if (today < weekStartDate) return 'future';
        if (today > weekEnd) return 'past';
        return 'current';
    };

    const weekStatus = getWeekStatus();
    const canEdit = weekStatus === 'current';
    
    const weekDays: Date[] = Array.from({ length: 7 }).map((_, i) => new Date(new Date(weekStartDate).setDate(weekStartDate.getDate() + i)));

    if (currentEvent) {
        return <EventEditor event={currentEvent} onSave={handleSaveEvent} onBack={() => setCurrentEvent(null)} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => handleWeekChange('prev')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">{t('venueDashboard.previousWeek')}</button>
                <h3 className="text-xl font-semibold text-center">{weekStartDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => handleWeekChange('next')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">{t('venueDashboard.nextWeek')}</button>
            </div>
             {weekStatus === 'future' && (
                <div className="bg-blue-900/50 text-blue-300 p-3 rounded-md text-center mb-4 text-sm">
                    {t('venueDashboard.futureWeekMessage')}
                </div>
            )}
            {loading ? <p>Caricamento eventi...</p> : (
                <div className="space-y-4">
                    {weekDays.map(day => {
                        const event = events.find(e => e.event_date === day.toISOString().split('T')[0]);
                        return (
                            <div key={day.toISOString()} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{day.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    {event ? <p className="text-sm text-red-400">{event.title}</p> : <p className="text-sm text-gray-400">{t('venueDashboard.noEventScheduled')}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditEvent(day)} disabled={!canEdit} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {event ? t('venueDashboard.editEvent') : t('venueDashboard.addEvent')}
                                    </button>
                                    {event && <button onClick={() => handleDeleteEvent(event.id)} disabled={!canEdit} className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">Elimina</button>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};


const EventEditor: React.FC<{ event: Partial<Event>, onSave: (event: Partial<Event>) => void, onBack: () => void }> = ({ event, onSave, onBack }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [currentEvent, setCurrentEvent] = useState(event);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);
        const filePath = `public/events/${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);

        if (uploadError) {
            toast.error(uploadError.message);
        } else {
            const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
            setCurrentEvent(prev => ({...prev, image_url: data.publicUrl }));
        }
        setUploading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(currentEvent);
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-red-400 hover:underline mb-4">
                <ArrowLeftIcon className="h-4 w-4" /> {t('eventEditor.backToSchedule')}
            </button>
            <h3 className="text-2xl font-bold mb-4">{t('eventEditor.title', { date: new Date(currentEvent.event_date!).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) })}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                 <div>
                    <label className="block text-sm">{t('eventEditor.eventName')}</label>
                    <input type="text" value={currentEvent.title || ''} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required />
                </div>
                <div>
                    <label className="block text-sm">{t('eventEditor.description')}</label>
                    <textarea value={currentEvent.description || ''} onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})} rows={4} className="w-full bg-gray-700 p-2 rounded" required />
                </div>
                 <div>
                    <label className="block text-sm">{t('eventEditor.image')}</label>
                    <input type="file" accept="image/*" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700" />
                    {uploading && <p className="text-yellow-400 text-sm mt-1">{t('eventEditor.uploading')}</p>}
                    {currentEvent.image_url && <img src={currentEvent.image_url} alt="Preview" className="mt-2 rounded-md max-h-40" />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm">{t('eventEditor.targetAudience')}</label>
                        <input type="text" value={currentEvent.target_audience || ''} onChange={e => setCurrentEvent({...currentEvent, target_audience: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm">{t('eventEditor.dressCode')}</label>
                        <input type="text" value={currentEvent.dress_code || ''} onChange={e => setCurrentEvent({...currentEvent, dress_code: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                </div>
                <h4 className="text-lg font-semibold pt-2">{t('eventEditor.costs')}</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm">{t('eventEditor.costSingleMale')}</label>
                        <input type="text" value={currentEvent.cost_single_male || ''} onChange={e => setCurrentEvent({...currentEvent, cost_single_male: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm">{t('eventEditor.costSingleFemale')}</label>
                        <input type="text" value={currentEvent.cost_single_female || ''} onChange={e => setCurrentEvent({...currentEvent, cost_single_female: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm">{t('eventEditor.costCouple')}</label>
                        <input type="text" value={currentEvent.cost_couple || ''} onChange={e => setCurrentEvent({...currentEvent, cost_couple: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm">{t('eventEditor.externalLink')}</label>
                    <input type="url" value={currentEvent.external_link || ''} onChange={e => setCurrentEvent({...currentEvent, external_link: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={uploading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
                        {uploading ? t('eventEditor.saving') : t('eventEditor.save')}
                    </button>
                    <button type="button" onClick={onBack} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">{t('dashboard.cancel')}</button>
                </div>
            </form>
        </div>
    );
};


const VenueDashboard: React.FC<VenueDashboardProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchVenueData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.from('venues').select('*').eq('id', user.id).single();
        if (error || !data) {
            toast.error("Dati del locale non trovati.");
            onClose();
        } else {
            setVenue(data);
        }
        setLoading(false);
    }, [user, onClose]);

    useEffect(() => {
        fetchVenueData();
    }, [fetchVenueData]);

    if (loading || !venue) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6">Caricamento dashboard...</div>
            </div>
        );
    }

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                     <h2 className="text-2xl font-bold text-white mb-2">{t('venueDashboard.title')}: {venue.name}</h2>
                     <div className="flex">
                        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'details' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('venueDashboard.detailsTab')}</button>
                        <button onClick={() => setActiveTab('events')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'events' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('venueDashboard.eventsTab')}</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'details' && (
                        <VenueDetailsEditor 
                            venue={venue} 
                            onUpdate={fetchVenueData}
                            onDeleteClick={() => setShowDeleteModal(true)}
                        />
                    )}
                    {activeTab === 'events' && (
                        <VenueScheduleManager 
                            venue={venue} 
                            onDataChange={fetchVenueData}
                        />
                    )}
                </div>
            </div>
        </div>
        {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} onConfirm={onClose} />}
        </>
    );
};

export default VenueDashboard;

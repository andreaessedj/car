import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import type { Venue, Event } from '../types';
import { XMarkIcon, UserCircleIcon, MapPinIcon, ArrowTopRightOnSquareIcon } from './icons';
import { useTranslation } from '../i18n';
import VipStatusIcon from './VipStatusIcon';

interface VenueDetailModalProps {
    venue: Venue;
    onClose: () => void;
}

const VenueDetailModal: React.FC<VenueDetailModalProps> = ({ venue, onClose }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(today.setDate(diff));
    });

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6);

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('venue_id', venue.id)
                .gte('event_date', weekStartDate.toISOString().split('T')[0])
                .lte('event_date', weekEndDate.toISOString().split('T')[0]);

            if (error) {
                toast.error(error.message);
            } else {
                const sortedEvents = (data || []).sort((a, b) => a.event_date.localeCompare(b.event_date));
                setEvents(sortedEvents);
            }
            setLoading(false);
        };

        fetchEvents();
    }, [venue.id, weekStartDate]);

    const handleWeekChange = (direction: 'prev' | 'next') => {
        setWeekStartDate(current => {
            const newDate = new Date(current);
            newDate.setDate(current.getDate() + (direction === 'prev' ? -7 : 7));
            return newDate;
        });
    };
    
    const weekDays: Date[] = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(weekStartDate);
        day.setDate(weekStartDate.getDate() + i);
        return day;
    });

    const todayDayName = useMemo(() => {
        return new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    }, []);

    const todayHours = venue.opening_hours?.[todayDayName] || t('venueDetail.closed');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {venue.logo_url ? (
                             <img src={venue.logo_url} alt={venue.name} className="w-24 h-24 rounded-lg object-cover border-2 border-gray-600 flex-shrink-0" />
                        ) : (
                            <div className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <UserCircleIcon className="w-16 h-16 text-gray-500" />
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                                <span>{venue.name}</span>
                                <VipStatusIcon profile={venue} className="h-7 w-7" />
                            </h2>
                             <div className="flex items-center text-sm text-gray-400 gap-2">
                                <MapPinIcon className="h-4 w-4" /> 
                                <span>{venue.address || t('map.unknownLocation')}</span>
                            </div>
                            <p className="text-gray-300 mt-2 text-sm">{venue.description}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar">
                     <div className="bg-gray-700/50 rounded-lg p-3 text-sm">
                        <h3 className="font-semibold text-white mb-2">{t('venueDetail.openingHours')}</h3>
                        <p className="text-green-400">
                            <span className="font-bold">{t('venueDetail.today')}:</span> {todayHours}
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mt-4 mb-2">
                            <button onClick={() => handleWeekChange('prev')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-md transition duration-300 text-xs">{t('venueDashboard.previousWeek')}</button>
                            <h3 className="text-lg font-semibold text-white">{t('venueDetail.weeklySchedule')}</h3>
                            <button onClick={() => handleWeekChange('next')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-md transition duration-300 text-xs">{t('venueDashboard.nextWeek')}</button>
                        </div>

                        {loading ? <p className="text-gray-400 text-center py-8">Caricamento eventi...</p> : (
                            <div className="space-y-3">
                                {weekDays.map(day => {
                                    const event = events.find(e => e.event_date === day.toISOString().split('T')[0]);
                                    return (
                                        <div key={day.toISOString()} className="bg-gray-700/50 p-3 rounded-lg">
                                            <h4 className="font-bold text-white mb-2">{day.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                                            {event ? (
                                                <div className="flex items-start gap-4">
                                                    {event.image_url && <img src={event.image_url} alt={event.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />}
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-red-400">{event.title}</h5>
                                                        <p className="text-sm text-gray-200 whitespace-pre-wrap mt-1">{event.description}</p>
                                                        
                                                        <div className="text-xs mt-2 text-gray-300 space-y-1">
                                                            {event.target_audience && <p><strong>Target:</strong> {event.target_audience}</p>}
                                                            {event.dress_code && <p><strong>{t('venueDetail.dressCode')}:</strong> {event.dress_code}</p>}
                                                        </div>

                                                        {(event.cost_single_male || event.cost_single_female || event.cost_couple) && (
                                                            <div className="mt-2 pt-2 border-t border-gray-600/50">
                                                                <p className="text-xs font-semibold text-gray-200 mb-1">{t('venueDetail.costs')}:</p>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-300">
                                                                    {event.cost_single_male && <span>Uomo: <strong>{event.cost_single_male}</strong></span>}
                                                                    {event.cost_single_female && <span>Donna: <strong>{event.cost_single_female}</strong></span>}
                                                                    {event.cost_couple && <span>Coppia: <strong>{event.cost_couple}</strong></span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {event.external_link && (
                                                            <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-red-700 transition-colors">{t('venueDetail.moreInfo')}</a>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">{t('venueDetail.noEvent')}</p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                 <div className="p-4 border-t border-gray-700 flex justify-end">
                     <a 
                        href={`https://www.google.com/maps?q=${venue.lat},${venue.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        {t('venueDetail.directions')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VenueDetailModal;
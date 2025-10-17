import React, { useMemo, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Checkin } from '../types';
import { MapPinIcon, UserIcon, MaleIcon, FemaleIcon, TransgenderIcon, CoupleIcon, ArrowTopRightOnSquareIcon } from './icons';
import { useTranslation } from '../i18n';
import VipStatusIcon from './VipStatusIcon';
import { isVipActive } from '../utils/vip';


const createIcon = (checkin: Checkin) => {
    let color = '#a1a1aa'; // Default zinc
    let IconComponent = <MapPinIcon color={color} />;
    
    if (checkin.status === 'Coppia') {
        color = '#f59e0b'; // amber
        IconComponent = <CoupleIcon color={color}/>;
    } else {
        switch (checkin.gender) {
            case 'M':
                color = '#2563eb'; // blue
                IconComponent = <MaleIcon color={color} />;
                break;
            case 'F':
                color = '#db2777'; // pink
                IconComponent = <FemaleIcon color={color} />;
                break;
            case 'Trav':
            case 'Trans':
                color = '#9333ea'; // purple
                IconComponent = <TransgenderIcon color={color} />;
                break;
        }
    }
    
    const ringClass = isVipActive(checkin.profiles) ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50' : '';

    const iconHtml = `
      <div class="w-8 h-8 p-1 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm ${ringClass}">
        ${ReactDOMServer.renderToString(IconComponent)}
      </div>
    `;

    return new L.DivIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

interface MapViewProps {
    checkins: Checkin[];
    onMarkerClick: (checkin: Checkin) => void;
    flyToLocation: [number, number] | null;
}

const FlyToController: React.FC<{ location: [number, number] | null }> = ({ location }) => {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 13, {
                animate: true,
                duration: 1.5
            });
        }
    }, [location, map]);
    return null;
}

const MapView: React.FC<MapViewProps> = ({ checkins, onMarkerClick, flyToLocation }) => {
    const { t } = useTranslation();
    
    const memoizedMarkers = useMemo(() => {
        return checkins.map(checkin => (
            <Marker key={checkin.id} position={[checkin.lat, checkin.lon]} icon={createIcon(checkin)}>
                <Popup>
                    <div className="text-gray-900 p-1 w-56">
                        <h3 className="font-bold text-lg mb-2 truncate flex items-center gap-2">
                            <span>{checkin.nickname}</span>
                            <VipStatusIcon profile={checkin.profiles} className="h-5 w-5 flex-shrink-0" />
                        </h3>
                        {checkin.photo && <img src={checkin.photo} alt={checkin.nickname} className="rounded-md mb-2 max-h-40 w-full object-cover" />}
                        <p className="text-sm mb-2 break-words line-clamp-2">{checkin.description}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-2">
                           <MapPinIcon className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{checkin.city || t('map.unknownLocation')}</span>
                        </div>
                         <div className="flex items-center text-xs text-gray-500 gap-2 mt-1">
                           <UserIcon className="h-4 w-4 flex-shrink-0" /> 
                           <span>{checkin.status === 'Coppia' ? t('genders.Coppia') : checkin.gender || t('map.notSpecified')}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button 
                                onClick={() => onMarkerClick(checkin)}
                                className="flex-1 bg-red-500 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
                            >
                                {t('map.comment')}
                            </button>
                            <a
                                href={`https://www.google.com/maps?q=${checkin.lat},${checkin.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>{t('map.navigate')}</span>
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </Popup>
            </Marker>
        ));
    }, [checkins, onMarkerClick, t]);

    return (
        <MapContainer center={[41.902782, 12.496366]} zoom={6} scrollWheelZoom={true} className="h-full w-full z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {memoizedMarkers}
            <FlyToController location={flyToLocation} />
        </MapContainer>
    );
};

export default MapView;
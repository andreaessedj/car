import React from 'react';
import { useTranslation } from '../i18n';
import { SparklesIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, MapPinIcon, MagnifyingGlassIcon } from './icons';
import type { Profile } from '../types';

interface VipInvitationModalProps {
    profile: Profile | null;
    onAccept: () => void;
    onClose: () => void;
    onRegister: () => void;
}

const VipInvitationModal: React.FC<VipInvitationModalProps> = ({ profile, onAccept, onClose, onRegister }) => {
    const { t } = useTranslation();
    const isLoggedIn = !!profile;

    const features = [
        { icon: <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-yellow-300" />, text: t('vipInvitation.feature1', { defaultValue: 'Messaggi privati illimitati' }) },
        { icon: <MapPinIcon className="h-6 w-6 text-yellow-300" />, text: t('vipInvitation.feature2', { defaultValue: 'Check-in in evidenza sulla mappa' }) },
        { icon: <SparklesIcon className="h-6 w-6 text-yellow-300" />, text: t('vipInvitation.feature3', { defaultValue: 'Badge VIP esclusivo sul profilo' }) },
        { icon: <MagnifyingGlassIcon className="h-6 w-6 text-yellow-300" />, text: t('vipInvitation.feature4', { defaultValue: 'Filtra la mappa per vedere solo i VIP' }) },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
            <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white z-10">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="text-center">
                    <SparklesIcon className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                    <h1 className="text-2xl font-bold text-white mb-2">{t('vipInvitation.title', { defaultValue: 'Sblocca il Tuo Potenziale!' })}</h1>
                    <p className="text-gray-300 mb-6">{t('vipInvitation.subtitle', { defaultValue: 'Passa a VIP per solo 1€ e goditi 30 giorni di vantaggi esclusivi.' })}</p>
                </div>

                <div className="space-y-3 my-6">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 bg-gray-800/50 p-3 rounded-lg">
                            <div className="flex-shrink-0">{feature.icon}</div>
                            <span className="text-gray-200">{feature.text}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                        <button
                            onClick={onAccept}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-base py-3 rounded-md transition duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30"
                        >
                            {t('vipInvitation.acceptButton', { defaultValue: 'Diventa VIP Ora a 1€' })}
                        </button>
                    ) : (
                        <>
                            <div className="text-center text-sm text-yellow-300 bg-yellow-900/50 p-3 rounded-lg">
                                {t('vipInvitation.mustRegister', { defaultValue: 'Per diventare VIP devi prima creare un account gratuito.' })}
                            </div>
                            <button
                                onClick={onRegister}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-3 rounded-md transition duration-300"
                            >
                                {t('vipInvitation.registerNow', { defaultValue: 'Registrati Ora' })}
                            </button>
                        </>
                    )}
                     <button
                        onClick={onClose}
                        className="w-full text-gray-400 hover:text-white text-sm py-2 rounded-md transition duration-300"
                    >
                        {t('vipInvitation.declineButton', { defaultValue: 'Forse più tardi' })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VipInvitationModal;
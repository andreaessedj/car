import React from 'react';
import { useTranslation } from '../i18n';
import { XMarkIcon, CheckCircleIcon } from './icons';

interface VipPromoModalProps {
    onClose: () => void;
}

const VipPromoModal: React.FC<VipPromoModalProps> = ({ onClose }) => {
    const { t } = useTranslation();

    const features = [
        'feature1',
        'feature2',
        'feature3',
        'feature4',
        'feature5',
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/50 rounded-lg shadow-2xl shadow-yellow-400/10 p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2">
                        {t('vipPromo.title')}
                    </h2>
                    <p className="text-gray-300 mb-6">{t('vipPromo.subtitle')}</p>
                </div>

                <ul className="space-y-3 mb-6">
                    {features.map(featureKey => (
                         <li key={featureKey} className="flex items-center gap-3">
                            <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                            <span className="text-gray-200">{t(`vipPromo.${featureKey}`)}</span>
                        </li>
                    ))}
                </ul>
                
                <p className="text-center text-amber-400 font-semibold">{t('vipPromo.footer')}</p>

            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default VipPromoModal;

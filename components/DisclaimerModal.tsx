import React from 'react';
import { useTranslation } from '../i18n';
import { ShieldExclamationIcon, CheckBadgeIcon } from './icons';

interface DisclaimerModalProps {
    onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar border border-red-500/20">
                <div className="flex flex-col items-center text-center">
                    <ShieldExclamationIcon className="h-12 w-12 text-red-500 mb-3" />
                    <h1 className="text-2xl font-bold text-white mb-2">{t('disclaimer.title')}</h1>
                    <p className="text-gray-400 text-sm mb-4">{t('disclaimer.intro')}</p>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-md my-4">
                    <p className="text-white font-semibold mb-3 text-center">{t('disclaimer.declarationTitle')}</p>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckBadgeIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{t('disclaimer.declaration1')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckBadgeIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{t('disclaimer.declaration2')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckBadgeIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{t('disclaimer.declaration3')}</span>
                        </li>
                         <li className="flex items-start gap-2">
                            <CheckBadgeIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{t('disclaimer.declaration4')}</span>
                        </li>
                    </ul>
                </div>
                
                <p className="text-gray-500 text-xs text-center mb-4">{t('disclaimer.exit')}</p>
                
                <button
                    onClick={onAccept}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-3 rounded-md transition duration-300 shadow-lg shadow-red-600/20 hover:shadow-red-600/30"
                >
                    {t('disclaimer.acceptButton')}
                </button>
            </div>
        </div>
    );
};

export default DisclaimerModal;
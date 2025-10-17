import React from 'react';
import { useTranslation } from '../i18n';

interface DisclaimerModalProps {
    onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h1 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-4 text-center">⚠️ {t('disclaimer.title')}</h1>
                <p className="text-gray-300 mb-4">{t('disclaimer.intro')}</p>
                <p className="text-gray-300 mb-4">{t('disclaimer.rules')}</p>
                <p className="text-white font-semibold mb-2">{t('disclaimer.declarationTitle')}</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                    <li>{t('disclaimer.declaration1')}</li>
                    <li>{t('disclaimer.declaration2')}</li>
                    <li>{t('disclaimer.declaration3')}</li>
                    <li>{t('disclaimer.declaration4')}</li>
                </ul>
                <p className="text-gray-400 text-sm mb-6">{t('disclaimer.exit')}</p>
                <button
                    onClick={onAccept}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg p-3 rounded-md transition duration-300"
                >
                    {t('disclaimer.acceptButton')}
                </button>
            </div>
        </div>
    );
};

export default DisclaimerModal;

import React, { useState } from 'react';
import PolicyModal from './PolicyModal';
import { PrivacyPolicyContent, TermsOfServiceContent } from './legalContent';

type ModalType = 'privacy' | 'terms' | null;

const Footer: React.FC = () => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const openModal = (type: ModalType) => setActiveModal(type);
    const closeModal = () => setActiveModal(null);

    return (
        <>
            <footer className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-2 text-center text-xs text-gray-400 backdrop-blur-sm">
                <div className="flex justify-center items-center gap-4">
                    <span>© {new Date().getFullYear()} ADULT-MEET. Tutti i diritti riservati.</span>
                    <button onClick={() => openModal('privacy')} className="hover:text-white hover:underline">Privacy Policy</button>
                    <span className="text-gray-600">|</span>
                    <button onClick={() => openModal('terms')} className="hover:text-white hover:underline">Termini di Servizio</button>
                </div>
            </footer>

            {activeModal === 'privacy' && (
                <PolicyModal title="Informativa sulla Privacy" onClose={closeModal}>
                    <PrivacyPolicyContent />
                </PolicyModal>
            )}

            {activeModal === 'terms' && (
                <PolicyModal title="Termini di Servizio" onClose={closeModal}>
                    <TermsOfServiceContent />
                </PolicyModal>
            )}
        </>
    );
};

export default Footer;

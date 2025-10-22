import React from 'react';
import { XMarkIcon } from './icons';

interface PolicyModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl relative flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 text-gray-300">
                    {children}
                </div>
                 <div className="p-3 border-t border-gray-700 flex justify-end sticky bottom-0 bg-gray-800">
                    <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PolicyModal;

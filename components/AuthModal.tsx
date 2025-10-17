import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from './icons';
import { useTranslation } from '../i18n';

interface AuthModalProps {
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success(t('auth.loginSuccess'));
                onClose();
            }
        } else {
            if (displayName.trim() === '') {
                toast.error(t('auth.displayNameRequired'));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName.trim()
                    }
                }
            });
            if (error) {
                toast.error(error.message);
            } else if (data.user?.identities?.length === 0) {
                 toast.error(t('auth.userExists'));
            }
             else {
                toast.success(t('auth.registerSuccess'));
                onClose();
            }
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="flex border-b border-gray-600 mb-4">
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-center font-semibold ${isLogin ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.login')}</button>
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-center font-semibold ${!isLogin ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.register')}</button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>

                <form onSubmit={handleAuth}>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-1">{t('auth.displayName')}</label>
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-300 mb-1">{t('auth.password')}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                        {loading ? t('auth.processing') : (isLogin ? t('auth.login') : t('auth.register'))}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
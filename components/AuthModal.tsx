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
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (view === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success(t('auth.loginSuccess'));
                onClose();
            }
        } else if (view === 'register') {
            if (displayName.trim() === '') {
                toast.error(t('auth.displayNameRequired'));
                setLoading(false);
                return;
            }
            if (gender.trim() === '') {
                toast.error(t('auth.genderRequired'));
                setLoading(false);
                return;
            }
            if (bio.trim() === '') {
                toast.error(t('auth.bioRequired'));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName.trim(),
                        gender: gender,
                        bio: bio.trim(),
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

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) {
            toast.error(t('auth.resetError'));
        } else {
            toast.success(t('auth.resetSuccess'));
            setView('login');
        }
        setLoading(false);
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                {view !== 'forgotPassword' ? (
                    <>
                        <div className="flex border-b border-gray-600 mb-4">
                            <button onClick={() => setView('login')} className={`flex-1 py-2 text-center font-semibold ${view === 'login' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.login')}</button>
                            <button onClick={() => setView('register')} className={`flex-1 py-2 text-center font-semibold ${view === 'register' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>{t('auth.register')}</button>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">{view === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>

                        <form onSubmit={handleAuth} className="space-y-4">
                            {view === 'register' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-300 mb-1">{t('auth.displayName')}</label>
                                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300 mb-1">{t('auth.gender')}</label>
                                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                                                <option value="">{t('checkinModal.select')}</option>
                                                <option value="M">{t('genders.M')}</option>
                                                <option value="F">{t('genders.F')}</option>
                                                <option value="Trav">{t('genders.Trav')}</option>
                                                <option value="Trans">{t('genders.Trans')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-1">{t('auth.bio')}</label>
                                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder={t('auth.bio')} required />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">{t('auth.password')}</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                            </div>
                            {view === 'login' && (
                                <div className="text-right -mt-2 mb-2">
                                    <button type="button" onClick={() => setView('forgotPassword')} className="text-sm text-red-400 hover:underline">
                                        {t('auth.forgotPassword')}
                                    </button>
                                </div>
                            )}
                            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                                {loading ? t('auth.processing') : (view === 'login' ? t('auth.login') : t('auth.register'))}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('auth.resetPasswordTitle')}</h2>
                        <p className="text-gray-300 mb-4">{t('auth.resetPasswordInstructions')}</p>
                        <form onSubmit={handlePasswordReset}>
                             <div className="mb-4">
                                <label className="block text-gray-300 mb-1">{t('auth.email')}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-md transition duration-300 disabled:bg-gray-500">
                                {loading ? t('auth.processing') : t('auth.sendResetLink')}
                            </button>
                        </form>
                         <div className="text-center mt-4">
                            <button type="button" onClick={() => setView('login')} className="text-sm text-red-400 hover:underline">
                                {t('auth.backToLogin')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
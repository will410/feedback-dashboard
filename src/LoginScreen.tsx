import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (email: string, token: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                // Fetch user info to verify email domain
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();

                if (userInfo.email && userInfo.email.toLowerCase().endsWith('@fresho.com')) {
                    onLogin(userInfo.email, tokenResponse.access_token);
                } else {
                    setError('Access denied. Please use your @fresho.com email address.');
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('User info fetch error:', err);
                setError('Failed to verify identity. Please try again.');
                setIsLoading(false);
            }
        },
        onError: () => {
            setError('Google Sign-In was unsuccessful.');
            setIsLoading(false);
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up text-center">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Feedback Intelligence</h1>
                    <p className="text-slate-500 mt-2">Sign in with your Fresho Google account</p>
                </div>

                <div className="flex justify-center mb-6">
                    <button
                        onClick={() => login()}
                        disabled={isLoading}
                        className="flex items-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 font-semibold py-3 px-6 rounded-full transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                        {isLoading ? 'Verifying...' : 'Sign in with Google'}
                        {!isLoading && <ArrowRight size={20} className="text-indigo-500" />}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 text-left mb-6">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="mt-6 text-center text-xs text-slate-400">
                    Protected System • Fresho Internal Use Only
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

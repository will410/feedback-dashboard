import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Lock, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (email: string) => void;
}

interface JwtPayload {
    email: string;
    name: string;
    picture: string;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const [error, setError] = useState('');

    const handleSuccess = (credentialResponse: CredentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const decoded = jwtDecode<JwtPayload>(credentialResponse.credential);
                const email = decoded.email;

                if (email && email.toLowerCase().endsWith('@fresho.com')) {
                    onLogin(email);
                } else {
                    setError('Access denied. Please use your @fresho.com email address.');
                }
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            console.error('Login error:', err);
        }
    };

    const handleError = () => {
        setError('Google Sign-In was unsuccessful. Please try again.');
    };

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
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_blue"
                        size="large"
                        shape="pill"
                        width="300"
                    />
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

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

const Login = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegister, setIsRegister] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const userInfoResponse = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );
                
                const { data } = await axios.post(`${API_URL}/auth/google`, {
                    credential: tokenResponse.access_token,
                    userInfo: userInfoResponse.data
                });
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                navigate('/dashboard');
            } catch (err) {
                console.error(err);
                setError('Google login failed. Please try again.');
            }
        },
        onError: () => {
            setError('Google login failed. Please try again.');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (isRegister) {
            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        
        const endpoint = isRegister ? 'register' : 'login';
        try {
            const { data } = await axios.post(`${API_URL}/auth/${endpoint}`, {
                name: isRegister ? name : undefined,
                email,
                password
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-sans">
            {/* Top Bar */}
            <header className="w-full py-6 px-8 flex justify-between items-center z-10">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Zentrack</h1>
                <div className="text-sm font-medium text-slate-600">
                    {isRegister ? (
                        <>Already have an account? <button onClick={() => setIsRegister(false)} className="text-slate-900 font-semibold hover:underline ml-1">Log in</button></>
                    ) : (
                        <>Don't have an account? <button onClick={() => setIsRegister(true)} className="text-slate-900 font-semibold hover:underline ml-1">Sign up</button></>
                    )}
                </div>
            </header>

            {/* Main content split */}
            <div className="flex-1 flex flex-col lg:flex-row items-stretch p-6 pt-0 gap-12 max-w-[1400px] mx-auto w-full">

                {/* Left Side: Illustration */}
                <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-center items-center bg-slate-100 rounded-3xl p-12 relative overflow-hidden border border-slate-200">
                    <div className="text-center mb-10 z-10">
                        <h2 className="text-4xl font-bold text-slate-900 mb-3">Track expenses with ease</h2>
                        <p className="text-lg text-slate-600 font-medium">Clear insights, smart budgets, and AI-powered reports</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center z-10 relative w-full">
                        <img
                            src="/abstract-blob.png"
                            alt="Expense Tracking"
                            className="w-full max-w-[400px] h-auto object-contain grayscale contrast-125 brightness-90"
                        />
                    </div>

                    <div className="mt-10 z-10 w-full max-w-md">
                        <div className="bg-white border border-slate-200 rounded-xl text-center py-3 px-6 text-slate-700 text-sm font-medium shadow-sm">
                            📊 Real-time analytics • 💰 Budget tracking • 🤖 AI insights
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Component */}
                <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start lg:pl-10">
                    <div className="w-full max-w-[420px]">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {isRegister ? "Create your account" : "Welcome back"}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {isRegister ? "Start tracking your expenses today" : "Log in to continue to Zentrack"}
                            </p>
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegister && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm bg-white"
                                        placeholder="John Doe"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm bg-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={isRegister ? 6 : undefined}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                            {isRegister && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-sm bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 mt-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
                            >
                                {isRegister ? 'Create Account' : 'Log In'}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <button
                                    onClick={() => handleGoogleLogin()}
                                    type="button"
                                    className="w-full flex justify-center items-center py-3 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <img src="/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-5 h-5 mr-2" />
                                    Continue with Google
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

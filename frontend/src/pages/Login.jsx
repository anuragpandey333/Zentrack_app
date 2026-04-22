import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // In a true implementation this sends the token to backend
                console.log(tokenResponse);
            } catch (err) {
                console.error(err);
            }
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isRegister ? 'register' : 'login';
        try {
            const { data } = await axios.post(`http://localhost:8000/api/auth/${endpoint}`, {
                name: isRegister ? email.split('@')[0] : undefined,
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
            {/* Top Bar matching screenshot */}
            <header className="w-full bg-brand-dark py-4 shadow-sm z-10 text-center">
                <h1 className="text-2xl font-bold text-white tracking-wide">Expense Tracker App</h1>
            </header>

            {/* Main content split */}
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-12 max-w-7xl mx-auto w-full">

                {/* Left Side: Illustration */}
                <div className="w-full lg:w-1/2 flex justify-center items-center">
                    <img
                        src="/login-illustration.png"
                        alt="Expense Tracking Illustration"
                        className="w-full max-w-lg h-auto object-contain"
                    />
                </div>

                {/* Right Side: Form Component */}
                <div className="w-full lg:w-1/2 flex justify-center">
                    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-10 w-full max-w-md border border-slate-50">

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-brand-dark tracking-tight">
                                {isRegister ? "Create Your Account" : "Track Your Expense"}
                            </h2>
                        </div>

                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-brand-dark mb-1">
                                    <span className="text-brand-primary mr-1">*</span>
                                    {isRegister ? "Email" : "Username"}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <input
                                        type={isRegister ? "email" : "text"}
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-[#c4dbf6] rounded-md focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition bg-brand-bg"
                                        placeholder={isRegister ? "you@example.com" : "justforcodeservice@gmail.com"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-dark mb-1">
                                    <span className="text-brand-primary mr-1">*</span>
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-2.5 border border-[#c4dbf6] rounded-md focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition bg-brand-bg"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-primary hover:text-brand-dark"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                            >
                                {isRegister ? 'Register' : 'Login'}
                            </button>
                        </form>

                        <div className="mt-6 flex justify-between items-center text-sm font-medium">
                            <button className="text-brand-primary hover:text-brand-dark transition">
                                Forgot Password?
                            </button>
                            <button
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-brand-primary hover:text-brand-dark transition"
                            >
                                {isRegister ? "Already have an account?" : "Don't have an account?"}
                            </button>
                        </div>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-white text-slate-400">Or connect with</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button
                                    onClick={() => handleGoogleLogin()}
                                    type="button"
                                    className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-200 rounded-md shadow-sm bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <svg className="h-5 w-5 mr-chat2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        <path fill="none" d="M1 1h22v22H1z" />
                                    </svg>
                                    <span className="ml-2">Google</span>
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

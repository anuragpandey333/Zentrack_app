import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
                console.log(tokenResponse);
            } catch (err) {
                console.error(err);
            }
        },
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
            const { data } = await axios.post(`http://localhost:8000/api/auth/${endpoint}`, {
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
            {/* Top Bar matching screenshot */}
            <header className="w-full py-6 px-8 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Zentrack</h1>
                <div className="text-sm font-medium text-gray-700">
                    {isRegister ? (
                        <>Already using Zentrack? <button onClick={() => setIsRegister(false)} className="text-gray-900 font-bold hover:underline ml-1">Log in.</button></>
                    ) : (
                        <>Don't have an account? <button onClick={() => setIsRegister(true)} className="text-gray-900 font-bold hover:underline ml-1">Sign up.</button></>
                    )}
                </div>
            </header>

            {/* Main content split */}
            <div className="flex-1 flex flex-col lg:flex-row items-stretch p-6 pt-0 gap-12 max-w-[1400px] mx-auto w-full">

                {/* Left Side: Gray Card Illustration */}
                <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-center items-center bg-[#cecece] rounded-2xl p-10 relative overflow-hidden">
                    <div className="text-center mb-8 z-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Find calm in your finances</h2>
                        <p className="text-lg text-gray-800 font-medium">Clear daily balance, trends, and budgets at a glance</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center z-10 relative w-full">
                        <img
                            src="/abstract-blob.png"
                            alt="Expense Tracking Abstract"
                            className="w-full max-w-[350px] h-auto object-contain mix-blend-multiply"
                        />
                    </div>

                    <div className="mt-8 z-10 w-full max-w-sm">
                        <div className="border border-blue-500 bg-transparent text-center py-2 text-gray-700 text-sm font-medium">
                            Overview, trends, and quick add
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Component */}
                <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start lg:pl-10">
                    <div className="w-full max-w-[400px]">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {isRegister ? "Create your free account" : "Log in to your account"}
                            </h2>
                            {isRegister && (
                                <p className="text-gray-500 text-sm"></p>
                            )}
                        </div>

                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegister && (
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-sm"
                                    placeholder="Full name"
                                />
                            )}
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-sm"
                                placeholder={isRegister ? "Work email" : "Email address"}
                            />
                            <input
                                type="password"
                                required
                                minLength={isRegister ? 6 : undefined}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-sm"
                                placeholder={isRegister ? "Create password" : "Password"}
                            />
                            {isRegister && (
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-sm"
                                    placeholder="Confirm password"
                                />
                            )}

                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 mt-2 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-[#00c805] hover:bg-[#00b004] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00c805] transition-colors"
                            >
                                {isRegister ? 'Create' : 'Log in'}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 bg-white text-gray-500">Or continue with SSO or social</span>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex gap-4">
                                <button
                                    onClick={() => handleGoogleLogin()}
                                    type="button"
                                    className="w-1/2 flex justify-center items-center py-2.5 px-4 rounded-full bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <img src="/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-5 h-5 mr-2" />
                                    Google
                                </button>
                                <button
                                    type="button"
                                    className="w-1/2 flex justify-center items-center py-2.5 px-4 rounded-full bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <img src="facebook-3-logo-svgrepo-com.svg" alt="Facebook" className="w-5 h-5 mr-2" />
                                    Facebook
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';
import { 
    User, 
    Mail, 
    Phone, 
    Globe, 
    Bell, 
    Shield, 
    CreditCard, 
    Camera, 
    ChevronDown,
    Save
} from 'lucide-react';
import { notificationManager } from '../utils/notifications';

const Settings = () => {
    const navigate = useNavigate();
    const { user, updateProfile, loading: userLoading } = useUser();
    const [activeTab, setActiveTab] = useState('Profile');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [notifications, setNotifications] = useState({
        notifySecurityAlerts: true,
        notifyMonthlyReports: true,
        notifyBudgetWarnings: false,
        notifyNewFeatures: true
    });
    
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        hobbies: '',
        currency: 'USD',
        picture: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                picture: user.picture || '',
                bio: user.bio || '',
                hobbies: user.hobbies || '',
                currency: user.currency || 'USD'
            }));
            setNotifications({
                notifySecurityAlerts: user.notifySecurityAlerts ?? true,
                notifyMonthlyReports: user.notifyMonthlyReports ?? true,
                notifyBudgetWarnings: user.notifyBudgetWarnings ?? false,
                notifyNewFeatures: user.notifyNewFeatures ?? true
            });
        }
    }, [navigate, user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            notificationManager.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            notificationManager.error('Image size should be less than 5MB');
            return;
        }

        setUploadingImage(true);
        try {
            // Compress and convert image
            const compressedImage = await compressImage(file);
            setProfile(prev => ({ ...prev, picture: compressedImage }));
            
            // Auto-save the profile picture
            await updateProfile({
                name: profile.name,
                picture: compressedImage,
                bio: profile.bio,
                hobbies: profile.hobbies,
                currency: profile.currency
            });
            notificationManager.success('Profile picture updated!');
        } catch (error) {
            console.error('Error uploading image:', error);
            notificationManager.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Resize if image is too large
                    const maxSize = 800;
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 with compression
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = async () => {
        try {
            setProfile(prev => ({ ...prev, picture: '' }));
            await updateProfile({
                name: profile.name,
                picture: '',
                bio: profile.bio,
                hobbies: profile.hobbies,
                currency: profile.currency
            });
            notificationManager.success('Profile picture removed');
        } catch (error) {
            console.error('Error removing photo:', error);
            notificationManager.error('Failed to remove photo');
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            await updateProfile({
                name: profile.name,
                picture: profile.picture,
                bio: profile.bio,
                hobbies: profile.hobbies,
                currency: profile.currency,
                ...notifications
            });
            
            notificationManager.success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            notificationManager.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const tabs = ['Profile', 'Account', 'Notifications', 'Security'];

    const TabButton = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`pb-4 px-1 text-sm font-medium transition-all relative ${
                activeTab === name 
                ? 'text-black' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {name}
            {activeTab === name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
        </button>
    );

    return (
        <Layout>
            <Header 
                title="Settings"
                subtitle="Manage your account preferences and settings."
            />
            <div className="max-w-5xl mx-auto">

                {/* Tabs Navigation */}
                <div className="flex gap-8 border-b border-slate-200 mb-8">
                    {tabs.map(tab => <TabButton key={tab} name={tab} />)}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {activeTab === 'Profile' && (
                        <>
                            {/* Personal Information Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Personal Information</h2>
                                
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                            {profile.picture ? (
                                                <img 
                                                    src={profile.picture} 
                                                    alt="Avatar" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-2xl font-bold">
                                                    {profile.email?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        {uploadingImage && (
                                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Upload Photo</label>
                                            <div className="flex gap-3">
                                                <label className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2">
                                                    <Camera size={18} />
                                                    {uploadingImage ? 'Uploading...' : 'Choose File'}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploadingImage}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {profile.picture && (
                                                    <button 
                                                        onClick={handleRemovePhoto}
                                                        className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Or Enter Photo URL</label>
                                            <input 
                                                type="url" 
                                                value={profile.picture?.startsWith('data:') ? '' : profile.picture || ''}
                                                onChange={(e) => setProfile({...profile, picture: e.target.value})}
                                                placeholder="https://example.com/photo.jpg"
                                                disabled={profile.picture?.startsWith('data:')}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                                            />
                                            {profile.picture?.startsWith('data:') && (
                                                <p className="text-xs text-slate-500 mt-1">Remove uploaded photo to use URL instead</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.name}
                                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="email" 
                                                value={profile.email}
                                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Bio</label>
                                        <input 
                                            type="text" 
                                            value={profile.bio || ''}
                                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                            placeholder="Tell us about yourself"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="tel" 
                                                value={profile.phone || ''}
                                                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">Preferences</h2>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Currency</label>
                                    <div className="relative">
                                        <select 
                                            value={profile.currency}
                                            onChange={(e) => setProfile({...profile, currency: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all appearance-none"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="INR">INR (₹)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">All amounts will be displayed in your selected currency</p>
                                </div>
                            </div>

                            {/* Email Notifications Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Email Notifications</h2>
                                <p className="text-slate-500 text-sm mb-6">Choose what updates you want to receive.</p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-900">Security alerts</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Get notified about suspicious activity and login attempts.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.notifySecurityAlerts}
                                                onChange={(e) => setNotifications({...notifications, notifySecurityAlerts: e.target.checked})}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-900">Monthly reports</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">A summary of your spending and savings every month.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.notifyMonthlyReports}
                                                onChange={(e) => setNotifications({...notifications, notifyMonthlyReports: e.target.checked})}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-900">Budget warnings</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Alerts when you reach 80% or 100% of your budget.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.notifyBudgetWarnings}
                                                onChange={(e) => setNotifications({...notifications, notifyBudgetWarnings: e.target.checked})}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-900">New features</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Be the first to know about new tools and improvements.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications.notifyNewFeatures}
                                                onChange={(e) => setNotifications({...notifications, notifyNewFeatures: e.target.checked})}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button 
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-8 py-3 bg-black text-white font-medium rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab !== 'Profile' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-20 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                {activeTab === 'Account' && <CreditCard className="text-slate-400" />}
                                {activeTab === 'Notifications' && <Bell className="text-slate-400" />}
                                {activeTab === 'Security' && <Shield className="text-slate-400" />}
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900">{activeTab} Settings</h2>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs">
                                These settings are coming soon. We're working hard to bring you more customization options.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Settings;

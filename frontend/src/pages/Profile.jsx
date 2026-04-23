import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { User, Mail, Edit2, Save, X, BookOpen, Heart } from 'lucide-react';
import axios from 'axios';
import { notificationManager } from '../utils/notifications';

const Profile = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bio: '',
        hobbies: ''
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        bio: '',
        hobbies: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:8000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(data);
            setEditForm(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            notificationManager.error('Failed to load profile');
        }
    };

    const handleEdit = () => {
        setEditForm(profile);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!editForm.name || !editForm.email) {
            notificationManager.error('Name and email are required');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.put(
                'http://localhost:8000/api/auth/profile',
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfile(data);
            setIsEditing(false);
            notificationManager.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            notificationManager.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
                    <p className="text-slate-600 mt-2">Manage your personal information</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>
                    
                    <div className="px-8 pb-8">
                        {/* Avatar and Edit Button */}
                        <div className="flex justify-between items-start -mt-16 mb-6">
                            <div className="bg-white rounded-full p-2 shadow-lg">
                                <div className="w-28 h-28 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                    <User size={48} className="text-purple-600" />
                                </div>
                            </div>
                            
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
                                >
                                    <Edit2 size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md disabled:opacity-50"
                                    >
                                        <Save size={18} />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Profile Information */}
                        {!isEditing ? (
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                        <User size={16} />
                                        Name
                                    </label>
                                    <p className="text-xl font-semibold text-slate-800">
                                        {profile.name || 'Not set'}
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                        <Mail size={16} />
                                        Email
                                    </label>
                                    <p className="text-lg text-slate-700">
                                        {profile.email || 'Not set'}
                                    </p>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                        <BookOpen size={16} />
                                        Bio
                                    </label>
                                    <p className="text-slate-700 leading-relaxed">
                                        {profile.bio || 'No bio added yet. Tell us about yourself!'}
                                    </p>
                                </div>

                                {/* Hobbies */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                        <Heart size={16} />
                                        Hobbies & Interests
                                    </label>
                                    <p className="text-slate-700">
                                        {profile.hobbies || 'No hobbies added yet. Share your interests!'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Edit Form */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <User size={16} />
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editForm.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Mail size={16} />
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <BookOpen size={16} />
                                        Bio
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={editForm.bio}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        {editForm.bio?.length || 0} / 500 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                        <Heart size={16} />
                                        Hobbies & Interests
                                    </label>
                                    <input
                                        type="text"
                                        name="hobbies"
                                        value={editForm.hobbies}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="e.g., Reading, Traveling, Photography"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-2">Account Status</h3>
                        <p className="text-sm text-purple-700">Active Member</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                        <h3 className="font-semibold text-pink-900 mb-2">Member Since</h3>
                        <p className="text-sm text-pink-700">
                            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;

import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    // Fetch user profile on mount
    useEffect(() => {
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_URL}/user/profile}`, config);
            setUser(res.data);
            // Cache in localStorage for instant load
            localStorage.setItem('userProfile', JSON.stringify(res.data));
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // Load from cache if available
            const cached = localStorage.getItem('userProfile');
            if (cached) setUser(JSON.parse(cached));
        } finally {
            setLoading(false);
        }
    };

    const updateProfilePhoto = async (photoUrl) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`${API_URL}/user/profile', 
                { picture: photoUrl }, 
                config
            );
            setUser(res.data);
            localStorage.setItem('userProfile', JSON.stringify(res.data));
            return res.data;
        } catch (error) {
            console.error('Failed to update profile photo:', error);
            throw error;
        }
    };

    const updateProfile = async (updates) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`${API_URL}/user/profile', updates, config);
            setUser(res.data);
            localStorage.setItem('userProfile', JSON.stringify(res.data));
            // Force re-fetch to ensure currency is updated
            await fetchUserProfile();
            return res.data;
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            loading, 
            updateProfilePhoto, 
            updateProfile,
            fetchUserProfile,
            logout 
        }}>
            {children}
        </UserContext.Provider>
    );
};

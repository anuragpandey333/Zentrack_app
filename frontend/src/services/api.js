import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const reportService = {
    generateReport: async () => {
        const { data } = await axios.get(`${API_BASE_URL}/reports/generate`, {
            headers: getAuthHeader()
        });
        return data;
    },

    getCategoryBudgets: async () => {
        const { data } = await axios.get(`${API_BASE_URL}/reports/category-budgets`, {
            headers: getAuthHeader()
        });
        return data;
    },

    setCategoryBudget: async (category, limit) => {
        const { data } = await axios.post(
            `${API_BASE_URL}/reports/category-budgets`,
            { category, limit },
            { headers: getAuthHeader() }
        );
        return data;
    },

    deleteCategoryBudget: async (category) => {
        const { data } = await axios.delete(
            `${API_BASE_URL}/reports/category-budgets/${category}`,
            { headers: getAuthHeader() }
        );
        return data;
    }
};

export const transactionService = {
    getAll: async () => {
        const { data } = await axios.get(`${API_BASE_URL}/transactions`, {
            headers: getAuthHeader()
        });
        return data;
    }
};

export const budgetService = {
    get: async () => {
        const { data } = await axios.get(`${API_BASE_URL}/budget`, {
            headers: getAuthHeader()
        });
        return data;
    },

    set: async (amount) => {
        const { data } = await axios.post(
            `${API_BASE_URL}/budget`,
            { amount },
            { headers: getAuthHeader() }
        );
        return data;
    }
};

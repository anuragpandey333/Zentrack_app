// ============================================
// AI FINANCIAL ASSISTANT - IMPLEMENTATION GUIDE
// ============================================

// 1. INSTALLATION
// ============================================
// Run in frontend directory:
// npm install jspdf jspdf-autotable

// 2. IMPORT THE COMPONENT
// ============================================
import AIReportModal from '../components/AIReportModal';
import { useState } from 'react';

// 3. BASIC USAGE IN YOUR COMPONENT
// ============================================
function MyDashboard() {
    const [showReportModal, setShowReportModal] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(20000);

    // Sample expense data structure
    const sampleExpenses = [
        {
            id: '1',
            description: 'Grocery Shopping',
            amount: 2500,
            category: 'Food',
            date: '2024-01-15',
            type: 'debit'
        },
        {
            id: '2',
            description: 'Uber Ride',
            amount: 350,
            category: 'Transport',
            date: '2024-01-16',
            type: 'debit'
        }
    ];

    return (
        <div>
            {/* Trigger Button */}
            <button 
                onClick={() => setShowReportModal(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg"
            >
                View AI Report
            </button>

            {/* Modal Component */}
            <AIReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportData={null}
                expenses={expenses}
                budget={budget}
            />
        </div>
    );
}

// 4. WITH BACKEND AI INTEGRATION
// ============================================
function DashboardWithAI() {
    const [showReportModal, setShowReportModal] = useState(false);
    const [aiReport, setAiReport] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(20000);
    const [loading, setLoading] = useState(false);

    const fetchAIAnalysis = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/ai/analyze', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setAiReport(data);
            setShowReportModal(true);
        } catch (error) {
            console.error('AI Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button 
                onClick={fetchAIAnalysis}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg"
            >
                {loading ? 'Analyzing...' : 'Get AI Insights'}
            </button>

            <AIReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportData={aiReport}
                expenses={expenses}
                budget={budget}
            />
        </div>
    );
}

export { MyDashboard, DashboardWithAI };

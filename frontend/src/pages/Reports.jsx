import React from 'react';
import Layout from '../components/Layout';
import { FileText } from 'lucide-react';

const Reports = () => {
    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
                <p className="text-slate-500">Download and view detailed financial reports.</p>
            </div>
            
            <div className="bg-white rounded-2xl py-16 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
                    <FileText size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Detailed Reports Coming Soon</h2>
                <p className="text-slate-500 max-w-md">Our team is working hard to bring you advanced Excel and PDF exporting features in the next update.</p>
            </div>
        </Layout>
    );
};

export default Reports;

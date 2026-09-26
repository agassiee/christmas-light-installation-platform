import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setAccessToken } from '../api/client';
import { CustomersTab } from './admin/CustomersTab';
import { PropertiesTab } from './admin/PropertiesTab';
import { WorkersTab } from './admin/WorkersTab';
import { JobsTab } from './admin/JobsTab';

type Tab = 'customers' | 'properties' | 'workers' | 'jobs';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    }
    setAccessToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex space-x-4">
        <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Jobs</button>
        <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 rounded ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Customers</button>
        <button onClick={() => setActiveTab('properties')} className={`px-4 py-2 rounded ${activeTab === 'properties' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Properties</button>
        <button onClick={() => setActiveTab('workers')} className={`px-4 py-2 rounded ${activeTab === 'workers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Workers</button>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'workers' && <WorkersTab />}
      </main>
    </div>
  );
};

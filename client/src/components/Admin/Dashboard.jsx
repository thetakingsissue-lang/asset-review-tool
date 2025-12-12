import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssetTypes from './AssetTypes';
import Submissions from './Submissions';
import Settings from './Settings';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('assetTypes');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'assetTypes', label: 'Asset Types' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'assetTypes':
        return <AssetTypes />;
      case 'submissions':
        return <Submissions />;
      case 'settings':
        return <Settings />;
      default:
        return <AssetTypes />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">
              Asset Review Tool - Admin
            </h1>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm transition-colors duration-200 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;

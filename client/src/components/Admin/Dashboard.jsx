import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssetTypes from './AssetTypes';
import Submissions from './Submissions';
import Settings from './Settings';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('asset-types');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Asset Review Tool - Admin</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
        >
          Logout
        </button>
      </header>

      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('asset-types')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderBottom: activeTab === 'asset-types' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'asset-types' ? '#3b82f6' : '#6b7280'
            }}
          >
            Asset Types
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderBottom: activeTab === 'submissions' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'submissions' ? '#3b82f6' : '#6b7280'
            }}
          >
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderBottom: activeTab === 'settings' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'settings' ? '#3b82f6' : '#6b7280'
            }}
          >
            Settings
          </button>
        </div>
      </nav>

      <main style={{ padding: '2rem' }}>
        {activeTab === 'asset-types' && <AssetTypes />}
        {activeTab === 'submissions' && <Submissions />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default Dashboard;

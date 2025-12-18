import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function Settings() {
  const [ghostMode, setGhostMode] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'ghost_mode')
        .single();

      if (error) throw error;
      
      if (data && data.setting_value) {
        setGhostMode(data.setting_value.enabled || false);
        setSubmissionCount(data.setting_value.submission_count || 0);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGhostMode = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    const newValue = !ghostMode;

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: {
            enabled: newValue,
            submission_count: newValue ? 0 : submissionCount // Reset count when enabling
          },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'ghost_mode');

      if (error) throw error;

      setGhostMode(newValue);
      if (newValue) {
        setSubmissionCount(0);
      }
      setSuccessMessage(`Ghost Mode ${newValue ? 'enabled' : 'disabled'} successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating ghost mode:', err);
      setError('Failed to update ghost mode setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h2>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading settings...
        </div>
      ) : (
        <div>
          {/* Ghost Mode Section */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Ghost Mode
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  AI processes submissions but doesn't show results to submitters. Only admins see AI analysis.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Use this during onboarding to validate AI accuracy before going live.
                </p>
              </div>
              <button
                onClick={handleToggleGhostMode}
                disabled={saving}
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  backgroundColor: ghostMode ? '#10b981' : '#d1d5db',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  marginLeft: '1rem'
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: ghostMode ? '30px' : '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </button>
            </div>

            {/* Ghost Mode Status */}
            <div style={{
              backgroundColor: ghostMode ? '#f0fdf4' : '#f9fafb',
              border: `1px solid ${ghostMode ? '#86efac' : '#e5e7eb'}`,
              borderRadius: '6px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Status:</span>{' '}
                  <span style={{ color: ghostMode ? '#065f46' : '#6b7280', fontWeight: '600' }}>
                    {ghostMode ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                {ghostMode && (
                  <div>
                    <span style={{ fontWeight: '500' }}>Submissions in ghost mode:</span>{' '}
                    <span style={{ fontWeight: '600', color: '#065f46' }}>
                      {submissionCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* How It Works */}
            {ghostMode && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
                  How Ghost Mode Works:
                </h4>
                <ul style={{ fontSize: '0.875rem', color: '#1e3a8a', paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.25rem' }}>Submitters upload assets normally</li>
                  <li style={{ marginBottom: '0.25rem' }}>AI analyzes in the background</li>
                  <li style={{ marginBottom: '0.25rem' }}>Submitters see "Submitted successfully" (no pass/fail)</li>
                  <li style={{ marginBottom: '0.25rem' }}>Admins see full AI analysis in Submissions tab</li>
                  <li>Compare AI decisions to your manual review to validate accuracy</li>
                </ul>
              </div>
            )}
          </div>

          {/* Future Settings Placeholder */}
          <div style={{
            border: '1px dashed #d1d5db',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p style={{ fontSize: '0.875rem' }}>Additional settings coming in Phase 3</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [filterAssetType, setFilterAssetType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  
  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionSignedUrl, setSelectedSubmissionSignedUrl] = useState(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Fetch submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Apply filters whenever submissions or filter values change
  useEffect(() => {
    applyFilters();
  }, [submissions, filterAssetType, filterResult, filterDateRange]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Filter by asset type
    if (filterAssetType !== 'all') {
      filtered = filtered.filter(s => s.asset_type === filterAssetType);
    }

    // Filter by result
    if (filterResult !== 'all') {
      filtered = filtered.filter(s => s.result === filterResult);
    }

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterDateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(s => new Date(s.submitted_at) >= cutoffDate);
    }

    setFilteredSubmissions(filtered);
  };

  // Helper function to extract storage path from file_url
  const getStoragePathFromUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    // Handle both old public URLs and any stored paths
    // Public URL format: https://[project].supabase.co/storage/v1/object/public/assets/submissions/filename.ext
    // Signed URL format: https://[project].supabase.co/storage/v1/object/sign/assets/submissions/filename.ext
    
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      
      // Extract path after /assets/
      const assetsIndex = pathname.indexOf('/assets/');
      if (assetsIndex !== -1) {
        // Return the path after 'assets/' (e.g., 'submissions/filename.ext')
        return pathname.substring(assetsIndex + 8); // 8 = length of '/assets/'
      }
      
      // If the file_url is already just a storage path (e.g., 'submissions/filename.ext')
      if (fileUrl.startsWith('submissions/')) {
        return fileUrl;
      }
      
      return null;
    } catch (err) {
      // If it's not a valid URL, check if it's a direct path
      if (fileUrl.startsWith('submissions/')) {
        return fileUrl;
      }
      console.error('Error parsing file URL:', err);
      return null;
    }
  };

  // Helper function to generate signed URL
  const getSignedUrl = async (fileUrl) => {
    const storagePath = getStoragePathFromUrl(fileUrl);
    if (!storagePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from('assets')
        .createSignedUrl(storagePath, 3600); // 1 hour expiration

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  const handleViewDetails = async (submission) => {
    setSelectedSubmission(submission);
    setSelectedSubmissionSignedUrl(null);
    setShowModal(true);
    
    // Generate signed URL for the image
    if (submission.file_url) {
      setLoadingSignedUrl(true);
      const signedUrl = await getSignedUrl(submission.file_url);
      setSelectedSubmissionSignedUrl(signedUrl);
      setLoadingSignedUrl(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
    setSelectedSubmissionSignedUrl(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUniqueAssetTypes = () => {
    const types = [...new Set(submissions.map(s => s.asset_type))];
    return types.sort();
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Submissions History
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          {filteredSubmissions.length} of {submissions.length} submissions
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '6px'
      }}>
        {/* Asset Type Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Asset Type
          </label>
          <select
            value={filterAssetType}
            onChange={(e) => setFilterAssetType(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Types</option>
            {getUniqueAssetTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Result Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Result
          </label>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Date Range
          </label>
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading submissions...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          {submissions.length === 0 ? 'No submissions yet.' : 'No submissions match your filters.'}
        </div>
      ) : (
        /* Table */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  File Name
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  Asset Type
                </th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  Result
                </th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  Confidence
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  Submitted
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {submission.file_name}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {submission.asset_type}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: submission.result === 'pass' ? '#d1fae5' : '#fee2e2',
                      color: submission.result === 'pass' ? '#065f46' : '#991b1b'
                    }}>
                      {submission.result === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500' }}>
                    {submission.confidence_score}%
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatDate(submission.submitted_at)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewDetails(submission)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Submission Details
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedSubmission.file_name}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Asset Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Preview</h4>
              {loadingSignedUrl ? (
                <div style={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  Loading image...
                </div>
              ) : selectedSubmissionSignedUrl ? (
                <img 
                  src={selectedSubmissionSignedUrl} 
                  alt={selectedSubmission.file_name}
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  backgroundColor: '#f9fafb',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  Unable to load image preview
                </div>
              )}
            </div>

            {/* Submission Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: '500' }}>Asset Type:</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedSubmission.asset_type}</span>
                
                <span style={{ fontWeight: '500' }}>Result:</span>
                <span style={{
                  color: selectedSubmission.result === 'pass' ? '#065f46' : '#991b1b',
                  fontWeight: '600'
                }}>
                  {selectedSubmission.result === 'pass' ? 'PASS' : 'FAIL'}
                </span>
                
                <span style={{ fontWeight: '500' }}>Confidence:</span>
                <span>{selectedSubmission.confidence_score}%</span>
                
                <span style={{ fontWeight: '500' }}>Submitted:</span>
                <span>{formatDate(selectedSubmission.submitted_at)}</span>
              </div>
            </div>

            {/* Violations */}
            {selectedSubmission.violations && selectedSubmission.violations.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#991b1b' }}>
                  Violations ({selectedSubmission.violations.length})
                </h4>
                <ul style={{ 
                  listStyleType: 'disc', 
                  paddingLeft: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {selectedSubmission.violations.map((violation, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem' }}>{violation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              {selectedSubmissionSignedUrl && (
                <a
                  href={selectedSubmissionSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Download File
                </a>
              )}
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Submissions;

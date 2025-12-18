import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function SubmitterInterface() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assetType, setAssetType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);

  // Fetch asset types from database on component mount
  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('asset_types')
          .select('name, description')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setAssetTypes(data || []);
        // Set first asset type as default if available
        if (data && data.length > 0) {
          setAssetType(data[0].name);
        }
      } catch (error) {
        console.error('Error fetching asset types:', error);
        setError('Failed to load asset types');
      }
    };

    fetchAssetTypes();
  }, []);

  const handleFileSelect = useCallback((selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    } else {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to review');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review asset');
      }

      // Check if ghost mode is active
      if (data.ghostMode) {
        // Ghost mode: Show generic success message
        setResult({
          ghostMode: true,
          message: data.message
        });
      } else {
        // Normal mode: Show AI results
        setResult(data.result);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during review');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Asset Review Tool</h1>
        <p>AI-powered brand compliance checker using GPT-4o Vision</p>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="review-form">
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <button type="button" className="remove-btn" onClick={handleReset}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="upload-text">
                  Drag and drop your image here, or{' '}
                  <label className="file-label">
                    browse
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleInputChange}
                      className="file-input"
                    />
                  </label>
                </p>
                <p className="upload-hint">Supports JPEG, PNG, GIF, WebP (max 10MB)</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="assetType">Asset Type</label>
            <select
              id="assetType"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="select-input"
              disabled={assetTypes.length === 0}
            >
              {assetTypes.length === 0 ? (
                <option>Loading asset types...</option>
              ) : (
                assetTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                    {type.description && ` - ${type.description}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="submit"
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              'Review Asset'
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          result.ghostMode ? (
            // Ghost Mode: Generic success message
            <div className="results pass">
              <div className="result-header">
                <div className="status-badge pass">
                  SUBMITTED
                </div>
              </div>
              <div className="result-summary">
                <h3>Submission Received</h3>
                <p>{result.message}</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Our team will review your submission and get back to you soon.
                </p>
              </div>
            </div>
          ) : (
            // Normal Mode: Show AI results
            <div className={`results ${result.pass ? 'pass' : 'fail'}`}>
              <div className="result-header">
                <div className={`status-badge ${result.pass ? 'pass' : 'fail'}`}>
                  {result.pass ? 'PASS' : 'FAIL'}
                </div>
                <div className="confidence">
                  <span className="confidence-label">Confidence</span>
                  <span className="confidence-value">{result.confidence}%</span>
                </div>
              </div>

              <div className="result-summary">
                <h3>Summary</h3>
                <p>{result.summary}</p>
              </div>

              {result.violations && result.violations.length > 0 && (
                <div className="violations">
                  <h3>Violations Found ({result.violations.length})</h3>
                  <ul>
                    {result.violations.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.pass && (!result.violations || result.violations.length === 0) && (
                <div className="no-violations">
                  <p>No violations detected. Asset meets brand guidelines.</p>
                </div>
              )}
            </div>
          )
        )}
      </main>

      <footer className="footer">
        <p>Powered by OpenAI GPT-4o Vision</p>
      </footer>
    </div>
  );
}

export default SubmitterInterface;
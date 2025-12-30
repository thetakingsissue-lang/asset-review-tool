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

      if (data.ghostMode) {
        setResult({
          ghostMode: true,
          message: data.message
        });
      } else {
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="submit-app">
      {/* Minimal header */}
      <header className="submit-header">
        <div className="submit-header-content">
          <h1 className="submit-title">Asset Submission</h1>
        </div>
      </header>

      <main className="submit-main">
        <div className="submit-container">
          {/* Left column: Form */}
          <div className="submit-form-section">
            <form onSubmit={handleSubmit} className="submit-form">
              {/* Asset Type Selection */}
              <div className="form-field">
                <label htmlFor="assetType" className="field-label">
                  Asset type
                </label>
                <select
                  id="assetType"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="field-select"
                  disabled={assetTypes.length === 0}
                >
                  {assetTypes.length === 0 ? (
                    <option>Loading...</option>
                  ) : (
                    assetTypes.map((type) => (
                      <option key={type.name} value={type.name}>
                        {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Upload Area */}
              <div className="form-field">
                <label className="field-label">File</label>
                <div
                  className={`upload-zone ${dragActive ? 'upload-zone-active' : ''} ${preview ? 'upload-zone-filled' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <div className="file-preview">
                      <div className="file-preview-image">
                        <img src={preview} alt="Preview" />
                      </div>
                      <div className="file-preview-info">
                        <span className="file-name">{file?.name}</span>
                        <span className="file-size">{file && formatFileSize(file.size)}</span>
                      </div>
                      <button type="button" className="file-remove" onClick={handleReset}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <div className="upload-icon-wrapper">
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 20h18" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="upload-text">
                        <label className="upload-button">
                          <span>Choose file</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                        </label>
                        <span className="upload-or">or drag and drop</span>
                      </div>
                      <p className="upload-hint">PNG, JPG, GIF, WebP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="form-error">
                  <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-button"
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    <span>Checking compliance...</span>
                  </>
                ) : (
                  'Submit for review'
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="submit-divider"></div>

          {/* Right column: Results */}
          <div className="submit-results-section">
            {!result ? (
              /* Placeholder before submission */
              <div className="results-placeholder">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="placeholder-title">Results</h3>
                <p className="placeholder-text">
                  Upload an asset and submit it for review. Compliance results will appear here.
                </p>
              </div>
            ) : result.ghostMode ? (
              /* Ghost Mode Result */
              <div className="result-card">
                <div className="result-status result-status-submitted">
                  <svg className="status-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Submitted</span>
                </div>
                <div className="result-body">
                  <p className="result-message">{result.message}</p>
                  <p className="result-note">Your submission is under review. You'll receive feedback shortly.</p>
                </div>
              </div>
            ) : (
              /* Normal Result */
              <div className="result-card">
                {/* Status Header */}
                <div className={`result-status ${result.pass ? 'result-status-pass' : 'result-status-fail'}`}>
                  {result.pass ? (
                    <svg className="status-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="status-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  )}
                  <span>{result.pass ? 'Pass' : 'Fail'}</span>
                  <span className="result-confidence">{result.confidence}% confidence</span>
                </div>

                {/* Summary */}
                <div className="result-body">
                  <div className="result-section">
                    <h3 className="result-section-title">Summary</h3>
                    <p className="result-summary-text">{result.summary}</p>
                  </div>

                  {/* Issues List */}
                  {result.violations && result.violations.length > 0 && (
                    <div className="result-section">
                      <h3 className="result-section-title">
                        Issues ({result.violations.length})
                      </h3>
                      <ul className="issues-list">
                        {result.violations.map((violation, index) => (
                          <li key={index} className="issue-item">
                            <svg className="issue-icon" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            <span>{violation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No Issues */}
                  {result.pass && (!result.violations || result.violations.length === 0) && (
                    <div className="result-section">
                      <div className="no-issues">
                        <svg className="no-issues-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span>No compliance issues detected</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SubmitterInterface;

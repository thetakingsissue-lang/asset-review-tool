import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';

const ASSET_TYPES = [
  { id: 'logo', name: 'Logo', description: 'Brand logos and marks' },
  { id: 'banner', name: 'Banner', description: 'Web banners and ads' },
  { id: 'social', name: 'Social Media', description: 'Social media posts and graphics' },
  { id: 'print', name: 'Print', description: 'Print materials and collateral' },
];

// Protected route component for admin dashboard
function AdminRoute() {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  return isAuthenticated ? <Dashboard /> : <Navigate to="/admin/login" replace />;
}

function SubmitterInterface() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assetType, setAssetType] = useState('logo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
    formData.append('image', file);
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

      setResult(data.result);
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
          {/* Upload Area */}
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

          {/* Asset Type Selector */}
          <div className="form-group">
            <label htmlFor="assetType">Asset Type</label>
            <select
              id="assetType"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="select-input"
            >
              {ASSET_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
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

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Display */}
        {result && (
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
        )}
      </main>

      <footer className="footer">
        <p>Powered by OpenAI GPT-4o Vision</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SubmitterInterface />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

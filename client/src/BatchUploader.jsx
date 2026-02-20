import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './BatchUploader.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const MAX_FILES = 30;
const CONCURRENT_LIMIT = 5;

function BatchUploader() {
  const [files, setFiles] = useState([]);
  const [assetType, setAssetType] = useState('');
  const [assetTypes, setAssetTypes] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  // Fetch asset types on mount
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
      } catch (err) {
        console.error('Error fetching asset types:', err);
        setError('Failed to load asset types');
      }
    };

    fetchAssetTypes();
  }, []);

  // Generate unique ID for each file
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(
      file => file.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      setError('Please select valid image files');
      return;
    }

    const remainingSlots = MAX_FILES - files.length;
    if (validFiles.length > remainingSlots) {
      setError(`Can only add ${remainingSlots} more files (max ${MAX_FILES})`);
    }

    const filesToAdd = validFiles.slice(0, remainingSlots).map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setFiles(prev => [...prev, ...filesToAdd]);
    setError(null);
  }, [files.length]);

  // Drag handlers
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
    if (e.dataTransfer.files?.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e.target.files?.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Remove a file
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResults(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Clear all files
  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setResults({});
    setProgress({ completed: 0, total: 0 });
  };

  // Process a single file
  const processFile = async (fileObj) => {
    const formData = new FormData();
    formData.append('file', fileObj.file);
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

      return {
        id: fileObj.id,
        status: 'complete',
        ghostMode: data.ghostMode,
        result: data.ghostMode ? { message: data.message } : data.result
      };
    } catch (err) {
      return {
        id: fileObj.id,
        status: 'error',
        error: err.message
      };
    }
  };

  // Process all files with throttling
  const processAllFiles = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress({ completed: 0, total: files.length });
    setResults({});

    // Mark all as pending
    const initialResults = {};
    files.forEach(f => {
      initialResults[f.id] = { status: 'pending' };
    });
    setResults(initialResults);

    // Process in batches of CONCURRENT_LIMIT
    const queue = [...files];
    let completed = 0;

    const processNext = async () => {
      if (queue.length === 0) return null;

      const fileObj = queue.shift();
      setResults(prev => ({
        ...prev,
        [fileObj.id]: { status: 'processing' }
      }));

      const result = await processFile(fileObj);

      setResults(prev => ({
        ...prev,
        [fileObj.id]: result
      }));

      completed++;
      setProgress({ completed, total: files.length });

      return processNext();
    };

    // Start CONCURRENT_LIMIT parallel workers
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENT_LIMIT, files.length); i++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
    setProcessing(false);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = { pass: 0, fail: 0, pending: 0, processing: 0, error: 0 };
    Object.values(results).forEach(r => {
      if (r.status === 'complete') {
        if (r.ghostMode || r.result?.pass) counts.pass++;
        else counts.fail++;
      } else if (r.status === 'error') {
        counts.error++;
      } else if (r.status === 'processing') {
        counts.processing++;
      } else {
        counts.pending++;
      }
    });
    return counts;
  };

  const counts = getStatusCounts();

  // Render result badge for thumbnail
  const renderBadge = (fileId) => {
    const result = results[fileId];
    if (!result) return null;

    if (result.status === 'pending') {
      return <div className="batch-badge batch-badge-pending">Pending</div>;
    }
    if (result.status === 'processing') {
      return (
        <div className="batch-badge batch-badge-processing">
          <span className="batch-spinner"></span>
        </div>
      );
    }
    if (result.status === 'error') {
      return <div className="batch-badge batch-badge-error">Error</div>;
    }
    if (result.ghostMode) {
      return <div className="batch-badge batch-badge-submitted">Submitted</div>;
    }
    if (result.result?.pass) {
      return (
        <div className="batch-badge batch-badge-pass">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="batch-badge batch-badge-fail">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </div>
    );
  };

  // Expanded detail modal
  const renderExpandedDetail = () => {
    if (!expandedId) return null;

    const fileObj = files.find(f => f.id === expandedId);
    const result = results[expandedId];

    if (!fileObj) return null;

    return (
      <div className="batch-modal-overlay" onClick={() => setExpandedId(null)}>
        <div className="batch-modal" onClick={e => e.stopPropagation()}>
          <button className="batch-modal-close" onClick={() => setExpandedId(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="batch-modal-image">
            <img src={fileObj.preview} alt={fileObj.name} />
          </div>

          <div className="batch-modal-content">
            <h3 className="batch-modal-filename">{fileObj.name}</h3>
            <p className="batch-modal-filesize">{formatFileSize(fileObj.size)}</p>

            {result?.status === 'error' && (
              <div className="batch-modal-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span>{result.error}</span>
              </div>
            )}

            {result?.status === 'complete' && !result.ghostMode && (
              <>
                <div className={`batch-modal-status ${result.result?.pass ? 'status-pass' : 'status-fail'}`}>
                  {result.result?.pass ? (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>Pass</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                      <span>Fail</span>
                    </>
                  )}
                  <span className="batch-modal-confidence">{result.result?.confidence}% confidence</span>
                </div>

                {result.result?.summary && (
                  <div className="batch-modal-section">
                    <h4>Summary</h4>
                    <p>{result.result.summary}</p>
                  </div>
                )}

                {result.result?.violations?.length > 0 && (
                  <div className="batch-modal-section">
                    <h4>Issues ({result.result.violations.length})</h4>
                    <ul className="batch-modal-violations">
                      {result.result.violations.map((v, i) => (
                        <li key={i}>
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.result?.customMessage && (
                  <div className={`batch-modal-custom ${result.result?.pass ? 'custom-pass' : 'custom-fail'}`}>
                    {result.result.customMessage}
                  </div>
                )}
              </>
            )}

            {result?.status === 'complete' && result.ghostMode && (
              <div className="batch-modal-ghost">
                <p>{result.result?.message || 'Submission received and is under review.'}</p>
              </div>
            )}

            {(!result || result.status === 'pending') && (
              <p className="batch-modal-pending">Waiting to process...</p>
            )}

            {result?.status === 'processing' && (
              <div className="batch-modal-processing">
                <span className="batch-spinner-large"></span>
                <p>Processing...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="batch-app">
      {/* Header */}
      <header className="batch-header">
        <div className="batch-header-content">
          <img
            src="/SubmitClear_Logo.png"
            alt="SubmitClear"
            className="batch-logo"
          />
          <span className="batch-header-badge">Batch Upload</span>
        </div>
      </header>

      <main className="batch-main">
        {/* Controls Section */}
        <div className="batch-controls">
          <div className="batch-controls-row">
            <div className="batch-field">
              <label htmlFor="assetType" className="batch-label">Asset Type</label>
              <select
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="batch-select"
                disabled={assetTypes.length === 0 || processing}
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

            <div className="batch-actions">
              {files.length > 0 && !processing && (
                <button className="batch-btn batch-btn-secondary" onClick={clearAll}>
                  Clear All
                </button>
              )}
              <button
                className="batch-btn batch-btn-primary"
                onClick={processAllFiles}
                disabled={files.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <span className="batch-spinner"></span>
                    Processing {progress.completed}/{progress.total}
                  </>
                ) : (
                  `Review ${files.length} Photo${files.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>

          {/* Progress bar during processing */}
          {processing && (
            <div className="batch-progress">
              <div
                className="batch-progress-bar"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          )}

          {/* Status summary after processing */}
          {Object.keys(results).length > 0 && !processing && (
            <div className="batch-summary">
              {counts.pass > 0 && <span className="batch-summary-pass">{counts.pass} Passed</span>}
              {counts.fail > 0 && <span className="batch-summary-fail">{counts.fail} Failed</span>}
              {counts.error > 0 && <span className="batch-summary-error">{counts.error} Errors</span>}
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="batch-error">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Upload zone */}
        {files.length < MAX_FILES && (
          <div
            className={`batch-upload ${dragActive ? 'batch-upload-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="batch-upload-content">
              <svg className="batch-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 20h18" strokeLinecap="round"/>
              </svg>
              <div className="batch-upload-text">
                <label className="batch-upload-button">
                  <span>Choose files</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleInputChange}
                    multiple
                    className="sr-only"
                    disabled={processing}
                  />
                </label>
                <span>or drag and drop</span>
              </div>
              <p className="batch-upload-hint">
                PNG, JPG, GIF, WebP up to 10MB each ({files.length}/{MAX_FILES} photos)
              </p>
            </div>
          </div>
        )}

        {/* Thumbnail grid */}
        {files.length > 0 && (
          <div className="batch-grid">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="batch-thumb"
                onClick={() => setExpandedId(fileObj.id)}
              >
                <img src={fileObj.preview} alt={fileObj.name} />
                {renderBadge(fileObj.id)}
                {!processing && (
                  <button
                    className="batch-thumb-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileObj.id);
                    }}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && (
          <div className="batch-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No photos yet</h3>
            <p>Upload up to {MAX_FILES} photos to review them all at once</p>
          </div>
        )}
      </main>

      {/* Expanded detail modal */}
      {renderExpandedDetail()}
    </div>
  );
}

export default BatchUploader;

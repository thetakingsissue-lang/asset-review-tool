import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function AssetTypes() {
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    guidelines: '',
    pass_message: '',
    fail_message: ''
  });
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch asset types on component mount
  useEffect(() => {
    fetchAssetTypes();
  }, []);

  const fetchAssetTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asset_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAssetTypes(data || []);
    } catch (err) {
      console.error('Error fetching asset types:', err);
      setError('Failed to load asset types');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate signed URLs for reference images
  const getSignedUrlsForImages = async (images) => {
    if (!images || images.length === 0) return [];

    const imagesWithSignedUrls = await Promise.all(
      images.map(async (img) => {
        if (!img.storagePath) return img;

        try {
          const { data, error } = await supabase.storage
            .from('assets')
            .createSignedUrl(img.storagePath, 3600); // 1 hour expiration

          if (error) {
            console.error('Error creating signed URL for:', img.storagePath, error);
            return { ...img, signedUrl: null };
          }

          return { ...img, signedUrl: data.signedUrl };
        } catch (err) {
          console.error('Error getting signed URL:', err);
          return { ...img, signedUrl: null };
        }
      })
    );

    return imagesWithSignedUrls;
  };

  const handleOpenModal = async (type = null) => {
    if (type) {
      // Editing existing type
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        guidelines: type.guidelines,
        pass_message: type.pass_message || '',
        fail_message: type.fail_message || ''
      });
      
      // Load existing reference images with signed URLs
      if (type.reference_images && type.reference_images.length > 0) {
        setLoadingImages(true);
        const imagesWithUrls = await getSignedUrlsForImages(type.reference_images);
        setReferenceImages(imagesWithUrls);
        setLoadingImages(false);
      } else {
        setReferenceImages([]);
      }
    } else {
      // Adding new type
      setEditingType(null);
      setFormData({
        name: '',
        description: '',
        guidelines: '',
        pass_message: '',
        fail_message: ''
      });
      setReferenceImages([]);
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({ 
      name: '', 
      description: '', 
      guidelines: '', 
      pass_message: '', 
      fail_message: '' 
    });
    setReferenceImages([]);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferenceImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadedImages = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = file.name.split('.').pop();
        const storagePath = `reference-images/${formData.name || 'temp'}/${timestamp}-${randomStr}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(storagePath, file);

        if (error) throw error;

        // Generate signed URL for immediate display
        const { data: signedData, error: signedError } = await supabase.storage
          .from('assets')
          .createSignedUrl(storagePath, 3600); // 1 hour expiration

        if (signedError) throw signedError;

        uploadedImages.push({
          fileName: file.name,
          storagePath: storagePath,
          signedUrl: signedData.signedUrl
        });
      }

      // Add to reference images array
      setReferenceImages(prev => [...prev, ...uploadedImages]);
    } catch (err) {
      console.error('Error uploading reference images:', err);
      setError('Failed to upload images: ' + err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveReferenceImage = async (index) => {
    const imageToRemove = referenceImages[index];
    
    try {
      // Delete from storage if it has a storagePath
      if (imageToRemove.storagePath) {
        const { error } = await supabase.storage
          .from('assets')
          .remove([imageToRemove.storagePath]);

        if (error) throw error;
      }

      // Remove from state
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error removing reference image:', err);
      setError('Failed to remove image: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      // Prepare reference images for storage (only save storagePath and fileName, not signed URLs)
      const referenceImagesForDb = referenceImages.map(img => ({
        fileName: img.fileName,
        storagePath: img.storagePath
      }));

      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        guidelines: formData.guidelines.trim(),
        pass_message: formData.pass_message.trim(),
        fail_message: formData.fail_message.trim(),
        reference_images: referenceImagesForDb,
        updated_at: new Date().toISOString()
      };

      if (editingType) {
        // Update existing
        const { error } = await supabase
          .from('asset_types')
          .update(dataToSave)
          .eq('id', editingType.id);

        if (error) throw error;
        setSuccessMessage('Asset type updated successfully!');
      } else {
        // Create new
        const { error } = await supabase
          .from('asset_types')
          .insert([dataToSave]);

        if (error) throw error;
        setSuccessMessage('Asset type created successfully!');
      }

      // Refresh list and close modal
      await fetchAssetTypes();
      handleCloseModal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving asset type:', err);
      setError('Failed to save asset type: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Get the asset type to find reference images
      const { data: assetType } = await supabase
        .from('asset_types')
        .select('reference_images')
        .eq('id', id)
        .single();

      // Delete reference images from storage
      if (assetType?.reference_images && assetType.reference_images.length > 0) {
        const pathsToDelete = assetType.reference_images
          .filter(img => img.storagePath)
          .map(img => img.storagePath);
        
        if (pathsToDelete.length > 0) {
          await supabase.storage
            .from('assets')
            .remove(pathsToDelete);
        }
      }

      // Delete asset type from database
      const { error } = await supabase
        .from('asset_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccessMessage('Asset type deleted successfully!');
      await fetchAssetTypes();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting asset type:', err);
      setError('Failed to delete asset type: ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Asset Types</h2>
        <button
          onClick={() => handleOpenModal()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Add New
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem'
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
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading asset types...
        </div>
      ) : assetTypes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No asset types found. Click "Add New" to create one.
        </div>
      ) : (
        /* Table */
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Description</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Guidelines</th>
              <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Ref Images</th>
              <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assetTypes.map((type) => (
              <tr key={type.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{type.name}</td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {type.description || <em style={{ color: '#d1d5db' }}>No description</em>}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280', maxWidth: '300px' }}>
                  {type.guidelines ? (
                    <span style={{ 
                      display: 'block', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {type.guidelines.substring(0, 100)}...
                    </span>
                  ) : (
                    <em style={{ color: '#d1d5db' }}>No guidelines</em>
                  )}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: type.reference_images?.length > 0 ? '#dbeafe' : '#f3f4f6',
                    color: type.reference_images?.length > 0 ? '#1e40af' : '#6b7280',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {type.reference_images?.length || 0}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleOpenModal(type)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      marginRight: '0.5rem'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(type.id, type.name)}
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingType ? 'Edit Asset Type' : 'Add New Asset Type'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Logo, Banner, Social Media"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Description Field */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this asset type"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Guidelines Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Guidelines
                </label>
                <textarea
                  name="guidelines"
                  value={formData.guidelines}
                  onChange={handleInputChange}
                  placeholder="Enter compliance guidelines for this asset type..."
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  These guidelines will be used by the AI to check submissions
                </p>
              </div>

              {/* Pass Message Field - NEW */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '0.5rem',
                  color: '#16a34a'
                }}>
                  Pass Message (shown when asset passes)
                </label>
                <textarea
                  name="pass_message"
                  value={formData.pass_message}
                  onChange={handleInputChange}
                  placeholder="Example: Congratulations! Please submit your asset to assets@nimbus.com"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Include submission instructions, email addresses, or next steps for compliant assets.
                </p>
              </div>

              {/* Fail Message Field - NEW */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '500', 
                  marginBottom: '0.5rem',
                  color: '#dc2626'
                }}>
                  Fail Message (shown when asset fails)
                </label>
                <textarea
                  name="fail_message"
                  value={formData.fail_message}
                  onChange={handleInputChange}
                  placeholder="Example: Please correct the violations listed above and resubmit, or contact sponsorhelp@nimbus.com for assistance."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Include instructions for fixing issues and contact information for help.
                </p>
              </div>

              {/* Reference Images Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Reference Images (Optional)
                </label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  Upload example images of compliant assets. The AI will use these as visual references when checking submissions.
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReferenceImageUpload}
                  disabled={uploadingImages}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                />

                {uploadingImages && (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem', 
                    marginBottom: '1rem' 
                  }}>
                    Uploading images...
                  </div>
                )}

                {loadingImages && (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem', 
                    marginBottom: '1rem' 
                  }}>
                    Loading reference images...
                  </div>
                )}

                {/* Reference Images Grid */}
                {referenceImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    {referenceImages.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        aspectRatio: '1'
                      }}>
                        {img.signedUrl ? (
                          <img
                            src={img.signedUrl}
                            alt={`Reference ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3f4f6',
                            color: '#9ca3af',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            padding: '0.5rem'
                          }}>
                            Unable to load image
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceImage(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Error */}
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetTypes;
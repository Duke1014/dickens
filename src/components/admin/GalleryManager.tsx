import React, { useEffect, useState } from 'react';
import { getGalleryPhotos, addGalleryPhoto, deleteGalleryPhoto, GalleryPhoto } from '../../lib/firebaseAdmin';
import { isCurrentUserAdmin } from '../../db/admin';
import '../../styles/ManagerStyles.css';

export default function GalleryManager() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', url: '' });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadPhotos();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const adminStatus = await isCurrentUserAdmin();
    setIsAdmin(adminStatus);
  }

  async function loadPhotos() {
    try {
      setLoading(true);
      const data = await getGalleryPhotos();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addGalleryPhoto({
        title: formData.title,
        description: formData.description,
        url: formData.url,
      });
      setFormData({ title: '', description: '', url: '' });
      setShowForm(false);
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add photo');
    }
  }

  async function handleDeletePhoto(id: string) {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await deleteGalleryPhoto(id);
      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  }

  if (loading) return <div>Loading gallery...</div>;

  return (
    <div className="manager">
      <h2>General Gallery</h2>
      {error && <div className="error-message">{error}</div>}

      {isAdmin && (
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Photo'}
        </button>
      )}

      {showForm && isAdmin && (
        <form className="form" onSubmit={handleAddPhoto}>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="url"
            placeholder="Image URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
          <button type="submit" className="btn btn-success">
            Upload
          </button>
        </form>
      )}

      <div className="photo-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-card">
            <img src={photo.url} alt={photo.title} />
            <div className="photo-info">
              <h3>{photo.title}</h3>
              {photo.description && <p>{photo.description}</p>}
              {isAdmin && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeletePhoto(photo.id!)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && <p>No photos yet. Add one to get started!</p>}
    </div>
  );
}

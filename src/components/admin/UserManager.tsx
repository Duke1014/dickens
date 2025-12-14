import React, { useEffect, useState, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getUsers, addUser, updateUser, deleteUser, CastMember, getUserByEmail } from '../../lib/firebaseAdmin';
import { isCurrentUserAdmin } from '../../db/admin';
import { uploadHeadshot, deleteHeadshot } from '../../lib/storageHelper';
import '../../styles/ManagerStyles.css';

export default function UserManager() {
  const [users, setUsers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ email: string; name: string; years: number[] }>({ email: '', name: '', years: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const adminStatus = await isCurrentUserAdmin();
    setIsAdmin(adminStatus);
    // console.log('Admin check:', adminStatus);
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, userId: string) {
    if (!isAdmin) {
      setError('Only admins can update photos');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Get current user to fetch old photo URL if it exists
      const currentUser = users.find(u => u.id === userId);
      const oldPhotoUrl = currentUser?.photoUrl;

      // Upload the new photo to Firebase Storage
      const downloadURL = await uploadHeadshot(userId, file);

      // If there was an old photo, delete it
      if (oldPhotoUrl) {
        await deleteHeadshot(oldPhotoUrl).catch(err => {
          console.warn('Could not delete old photo:', err);
        });
      }

      // Update the user document with the new photo URL
      await updateUser(userId, { photoUrl: downloadURL });
      console.log('User document updated with photo URL:', downloadURL);
      
      await loadUsers();
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError(null);
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        // When editing: only update email, name, and years. Never touch the role field.
        await updateUser(editingId, {
          email: formData.email,
          name: formData.name,
          years: formData.years,
        });
      } else {
        // When creating new user: set role to 'cast'
        await addUser({
          email: formData.email,
          name: formData.name,
          role: 'cast',
          years: formData.years,
        });
      }
      setFormData({ email: '', name: '', years: [] });
      setEditingId(null);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  }

  function handleEdit(user: CastMember) {
    setFormData({
      email: user.email || '',
      name: user.name,
      years: user.years || [],
    });
    setEditingId(user.id!);
    setShowForm(true);
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Remove this user?')) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="manager">
      <h2>Company Portal Users</h2>
      {error && <div className="error-message">{error}</div>}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        Admin: {isAdmin ? 'Yes ✓' : 'No ✗'}
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add User'}
      </button>

      {showForm && (
        <form className="form" onSubmit={handleSaveUser}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <label>Years on Cast:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => 1990 + i).map(year => (
              <label key={year} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={formData.years.includes(year)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, years: [...formData.years, year].sort() });
                    } else {
                      setFormData({ ...formData, years: formData.years.filter(y => y !== year) });
                    }
                  }}
                />
                {year}
              </label>
            ))}
          </div>
          {isAdmin && editingId && (
            <div>
              <label htmlFor="photo-file-form" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Upload Headshot:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  id="photo-file-form"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => handlePhotoUpload({ target: { files: photoFile ? [photoFile] : [] } } as any, editingId)}
                  disabled={uploading || !photoFile}
                  style={{ marginTop: 0 }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Max 5MB. Formats: JPG, PNG, WebP, etc.
              </div>
            </div>
          )}
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="user-list">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Years</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user.photoUrl && (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  {user.years && user.years.length > 0 ? user.years.join(', ') : ''}
                </td>
                <td>
                  {isAdmin && (
                    <>
                      <button className="btn btn-small" onClick={() => handleEdit(user)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteUser(user.id!)}
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {!isAdmin && (
                    <button className="btn btn-small" onClick={() => handleEdit(user)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && <p>No users yet. Add one to get started!</p>}
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  getUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  CastMember, 
  // getUserByEmail, 
  addCastPhoto, 
  deleteCastPhotosForMember 
} from '../../lib/firebaseAdmin';
import { isCurrentUserAdmin } from '../../db/admin';
import { uploadHeadshot, deleteHeadshot } from '../../lib/storageHelper';
import '../../styles/ManagerStyles.css';

export default function UserManager() {
  const [users, setUsers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ email: string; firstname: string; lastname: string; years: number[] }>({ email: '', firstname: '', lastname: '', years: [] });
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
    // allow admins or the owner (user uploading to their own folder)
    const currentUid = getAuth().currentUser?.uid;
    if (!isAdmin && currentUid !== userId) {
      setError('Only admins or the user themselves can update this photo');
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
  const oldHeadshot = (currentUser as any)?.headshot;

      // Upload the new photo to Firebase Storage
      const downloadURL = await uploadHeadshot(userId, file);

      // If there was an old photo, delete it
      if (oldHeadshot) {
        await deleteHeadshot(oldHeadshot).catch(err => {
          console.warn('Could not delete old photo:', err);
        });
      }

      // Update the user document with the new photo URL
  // Cast the update to avoid mismatched Local CastMember typings in some build setups
  await updateUser(userId, ({ headshot: downloadURL } as unknown) as Partial<CastMember>);
      console.log('User document updated with photo URL:', downloadURL);
      // Also add to cast photos (so it appears in the headshot gallery)
      try {
        await addCastPhoto({ url: downloadURL, title: 'Headshot', description: '', castMemberId: userId });
      } catch (err) {
        console.warn('Failed to add cast photo entry:', err);
      }
      
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
          firstname: formData.firstname,
          lastname: formData.lastname,
          name: `${formData.firstname} ${formData.lastname}`,
          years: formData.years,
        });
      } else {
        // When creating new user: set role to 'cast'
        await addUser({
          email: formData.email,
          firstname: formData.firstname,
          lastname: formData.lastname,
          name: `${formData.firstname} ${formData.lastname}`,
          role: 'cast',
          years: formData.years,
        });
      }
      setFormData({ email: '', firstname: '', lastname: '', years: [] });
      setEditingId(null);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  }

  function handleEdit(user: CastMember) {
    // populate firstname/lastname from stored fields or split on name if needed
    let first = '';
    let last = '';
    if ((user as any).firstname) {
      first = (user as any).firstname;
      last = (user as any).lastname || '';
    } else if (user.name) {
      const parts = user.name.split(' ');
      first = parts.shift() || '';
      last = parts.join(' ');
    }
    setFormData({
      email: user.email || '',
      firstname: first,
      lastname: last,
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

  async function handleRemovePhoto(userId: string) {
    if (!isAdmin) {
      setError('Only admins can remove photos');
      return;
    }
    if (!window.confirm('Remove this user\'s headshot? This will delete the file from Storage and remove gallery entries.')) return;
    try {
  const currentUser = users.find(u => u.id === userId);
  const url = (currentUser as any)?.headshot;
      if (!url) {
        setError('No photo found for this user');
        return;
      }
      // delete storage object
      await deleteHeadshot(url);
  // clear user document's headshot (use empty string to satisfy TS `string | undefined`)
  await updateUser(userId, ({ headshot: '' } as unknown) as Partial<CastMember>);
      // remove any castPhotos entries referencing this url for that user
      await deleteCastPhotosForMember(userId, url);
      await loadUsers();
      setError(null);
    } catch (err) {
      console.error('Failed to remove photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    }
  }

  // current editing user (used to decide if upload is allowed or if existing headshot must be removed first)
  const editingUser = editingId ? users.find(u => u.id === editingId) : null;
  const editingUserHeadshot = (editingUser as any)?.headshot;

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
            placeholder="First Name"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            required
          />
          <label>Years on Cast:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            {Array.from({ length: new Date().getFullYear() - 1994 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
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
              {editingUserHeadshot ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#333' }}>A headshot already exists for this user — please remove it first before uploading a new one.</div>
                  <button className="btn btn-danger btn-small" onClick={() => handleRemovePhoto(editingId!)}>
                    Remove Existing Headshot
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
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
              <th>First Name</th>
              <th>Last Name</th>
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
                    {(user as any).headshot && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={(user as any).headshot}
                          alt={(user.firstname || '') + ' ' + (user.lastname || '')}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <button className="btn btn-small" onClick={() => handleRemovePhoto(user.id!)} style={{ marginLeft: 6 }}>
                          Remove
                        </button>
                      </div>
                    )}
                    {user.firstname || user.name || ''}
                  </div>
                </td>
                <td>{user.lastname || ''}</td>
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

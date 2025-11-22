import React, { useEffect, useState } from 'react';
import { getUsers, addUser, updateUser, deleteUser, AppUser } from '../../lib/firebaseAdmin';
import '../../styles/ManagerStyles.css';

export default function UserManager() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', name: '', role: 'cast' as 'admin' | 'cast' | 'user' });

  useEffect(() => {
    loadUsers();
  }, []);

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

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateUser(editingId, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        });
      } else {
        await addUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
        });
      }
      setFormData({ email: '', name: '', role: 'cast' });
      setEditingId(null);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  }

  function handleEdit(user: AppUser) {
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
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
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="user">User</option>
            <option value="cast">Cast</option>
            <option value="admin">Admin</option>
          </select>
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
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <button className="btn btn-small" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteUser(user.id!)}
                  >
                    Remove
                  </button>
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

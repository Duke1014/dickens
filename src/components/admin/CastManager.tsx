import React, { useEffect, useState } from 'react';
import {
  getCastMembers,
  addCastMember,
  updateCastMember,
  deleteCastMember,
  CastMember,
} from '../../lib/firebaseAdmin';
import '../../styles/ManagerStyles.css';

export default function CastManager() {
  const [members, setMembers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', bio: '', photoUrl: '' });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await getCastMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cast members');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCastMember(editingId, {
          name: formData.name,
          role: formData.role,
          bio: formData.bio,
          photoUrl: formData.photoUrl,
        });
      } else {
        await addCastMember({
          name: formData.name,
          role: formData.role,
          bio: formData.bio,
          photoUrl: formData.photoUrl,
        });
      }
      setFormData({ name: '', role: '', bio: '', photoUrl: '' });
      setEditingId(null);
      setShowForm(false);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
    }
  }

  function handleEdit(member: CastMember) {
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      photoUrl: member.photoUrl || '',
    });
    setEditingId(member.id!);
    setShowForm(true);
  }

  async function handleDeleteMember(id: string) {
    if (!window.confirm('Delete this cast member?')) return;
    try {
      await deleteCastMember(id);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    }
  }

  if (loading) return <div>Loading cast members...</div>;

  return (
    <div className="manager">
      <h2>Cast Management</h2>
      {error && <div className="error-message">{error}</div>}

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Cast Member'}
      </button>

      {showForm && (
        <form className="form" onSubmit={handleSaveMember}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Role (e.g., Lead, Supporting)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          />
          <textarea
            placeholder="Bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
          <input
            type="url"
            placeholder="Profile Photo URL"
            value={formData.photoUrl}
            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
          />
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="member-list">
        {members.map((member) => (
          <div key={member.id} className="member-card">
            {member.photoUrl && <img src={member.photoUrl} alt={member.name} />}
            <div className="member-info">
              <h3>{member.name}</h3>
              <p className="role">{member.role}</p>
              {member.bio && <p className="bio">{member.bio}</p>}
              <div className="member-actions">
                <button className="btn btn-small" onClick={() => handleEdit(member)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteMember(member.id!)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && <p>No cast members yet. Add one to get started!</p>}
    </div>
  );
}

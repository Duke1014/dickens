import React, { useEffect, useState } from 'react';
import '../../styles/ManagerStyles.css';
import { isCurrentUserAdmin } from '../../db/admin';
import { Sponsor, getSponsors, addSponsor, updateSponsor, deleteSponsor } from '../../lib/firebaseAdmin';

export default function SponsorManager() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; website: string; tier: number }>({ name: '', website: '', tier: 1 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadSponsors();
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const adminStatus = await isCurrentUserAdmin();
    setIsAdmin(adminStatus);
  }

  async function loadSponsors() {
    try {
      setLoading(true);
      const data = await getSponsors();
      // sort by tier desc, then newest first
      data.sort((a, b) => {
        if (b.tier !== a.tier) return b.tier - a.tier;
        const aTime = a.createdAt && (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
        const bTime = b.createdAt && (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
        return bTime - aTime;
      });
      setSponsors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        setError('Sponsor name is required');
        return;
      }
      if (formData.tier < 1 || formData.tier > 10) {
        setError('Tier must be a positive number');
        return;
      }

      if (editingId) {
        await updateSponsor(editingId, {
          name: formData.name.trim(),
          website: formData.website.trim() || undefined,
          tier: formData.tier,
        });
      } else {
        await addSponsor({
          name: formData.name.trim(),
          website: formData.website.trim() || undefined,
          tier: formData.tier,
        });
      }

      setFormData({ name: '', website: '', tier: 1 });
      setEditingId(null);
      setShowForm(false);
      await loadSponsors();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sponsor');
    }
  }

  function handleEdit(s: Sponsor) {
    setFormData({ name: s.name, website: s.website || '', tier: s.tier });
    setEditingId(s.id || null);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this sponsor?')) return;
    try {
      await deleteSponsor(id);
      await loadSponsors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sponsor');
    }
  }

  function formatDate(value?: any) {
    if (!value) return '';
    if (value.toDate) return value.toDate().toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    try { return new Date(value).toLocaleString(); } catch { return '' }
  }

  if (loading) return <div>Loading sponsors...</div>;

  return (
    <div className="manager">
      <h2>Sponsors</h2>
      {error ? <div className="error-message">{error}</div> : null}

      {isAdmin && (
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', website: '', tier: 1 }); }}>
          {showForm ? 'Cancel' : 'Add Sponsor'}
        </button>
      )}

      {showForm && isAdmin && (
        <form className="form" onSubmit={handleSave}>
          <input
            type="text"
            placeholder="Sponsor Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="Website (optional)"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <label>Sponsor Tier</label>
          <select
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: Number(e.target.value) })}
            required
          >
            <option value={1}>Tiny Tim</option>
            <option value={2}>Bob Cratchit</option>
            <option value={3}>Ghost of Christmas Future</option>
            <option value={4}>Charles Dickens</option>
          </select>
          <button type="submit" className="btn btn-success" style={{ marginTop: 8 }}>
            {editingId ? 'Update' : 'Add'} Sponsor
          </button>
        </form>
      )}

      <div style={{ marginTop: 12 }}>
        {sponsors.length === 0 && <p>No sponsors yet.</p>}
        <table className="user-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
              <th>Tier</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.website ? (<a href={s.website} target="_blank" rel="noopener noreferrer">Visit</a>) : ''}</td>
                <td>{s.tier}</td>
                <td style={{ fontSize: 12, color: '#666' }}>{formatDate(s.createdAt)}</td>
                <td>
                  {isAdmin && (
                    <>
                      <button className="btn btn-small" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(s.id!)} style={{ marginLeft: 8 }}>Remove</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
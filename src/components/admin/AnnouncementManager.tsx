import React, { useEffect, useState } from 'react';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, Announcement } from '../../db/announcements';
// import { getAuth } from 'firebase/auth';
// import { getUserByEmail } from '../../lib/firebaseAdmin';
import { isCurrentUserAdmin } from '../../db/admin';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementForm, setAnnouncementForm] = useState<{ title: string; message: string }>({ title: '', message: '' });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadAnnouncements();
  }, []);

  async function checkAdminStatus() {
    const adminStatus = await isCurrentUserAdmin();
    setIsAdmin(adminStatus);
  }

  async function loadAnnouncements() {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    }
  }

  async function handleAnnouncementSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingAnnouncementId) {
        await updateAnnouncement(editingAnnouncementId, {
          title: announcementForm.title,
          message: announcementForm.message,
        });
      } else {
        await addAnnouncement(announcementForm.title, announcementForm.message);
      }
      setAnnouncementForm({ title: '', message: '' });
      setEditingAnnouncementId(null);
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement');
    }
  }

  function handleEditAnnouncement(a: Announcement) {
    setAnnouncementForm({ title: a.title, message: a.message });
    setEditingAnnouncementId(a.id!);
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    }
  }

  if (!isAdmin) {
    return <div className="manager"><h2>Announcements</h2><div className="error-message">Admin access required.</div></div>;
  }

  return (
    <div className="manager">
      <h2>Announcements</h2>
      {error && <div className="error-message">{error}</div>}
      <form className="form" onSubmit={handleAnnouncementSubmit} style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Title"
          value={announcementForm.title}
          onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
          required
          style={{ marginBottom: 8 }}
        />
        <textarea
          placeholder="Message"
          value={announcementForm.message}
          onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
          required
          style={{ marginBottom: 8 }}
        />
        <button type="submit" className="btn btn-success">
          {editingAnnouncementId ? 'Update' : 'Add'} Announcement
        </button>
        {editingAnnouncementId && (
          <button type="button" className="btn btn-small" style={{ marginLeft: 8 }} onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm({ title: '', message: '' }); }}>
            Cancel
          </button>
        )}
      </form>
      <div>
        {announcements.length === 0 && <p>No announcements yet.</p>}
        {announcements.map(a => {
          const createdDate = a.createdAt.toDate();
          const formatted = createdDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const time = createdDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return (
          <div key={a.id} style={{ border: '1px solid #ccc', borderRadius: 4, padding: 12, marginBottom: 12 }}>
            <strong>{a.title}</strong>
            <p style={{ margin: '8px 0' }}>{a.message}</p>
            <div style={{ fontSize: 12, color: '#888' }}>Posted: {formatted} at {time}</div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-small" onClick={() => handleEditAnnouncement(a)} style={{ marginRight: 8 }}>Edit</button>
              <button className="btn btn-danger btn-small" onClick={() => handleDeleteAnnouncement(a.id!)}>Delete</button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

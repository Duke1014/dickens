import { useState } from 'react';
import GalleryManager from '../components/admin/GalleryManager';
import UserManager from '../components/admin/UserManager';
import AnnouncementManager from '../components/admin/AnnouncementManager';
import '../styles/Admin.css';
import SponsorManager from '../components/admin/SponsorManager';

type AdminTab = 'gallery' | 'announcements' | 'users' | 'sponsors';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('gallery');

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      <nav className="admin-nav">
        <button
          className={`admin-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button
          className={`admin-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sponsors')}
        >
          Sponsors
        </button>
      </nav>

      <div className="admin-content">
        {activeTab === 'gallery' && <GalleryManager />}
        {activeTab === 'announcements' && <AnnouncementManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'sponsors' && <SponsorManager />}
      </div>
    </div>
  );
}

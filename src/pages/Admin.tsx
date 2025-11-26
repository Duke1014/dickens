import { useState } from 'react';
import GalleryManager from '../components/admin/GalleryManager';
import UserManager from '../components/admin/UserManager';
import '../styles/Admin.css';

type AdminTab = 'gallery' | 'cast' | 'users';

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
        {/* <button
          className={`admin-tab ${activeTab === 'cast' ? 'active' : ''}`}
          onClick={() => setActiveTab('cast')}
        >
          Cast
        </button> */}
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </nav>

      <div className="admin-content">
        {activeTab === 'gallery' && <GalleryManager />}
        {/* {activeTab === 'cast' && <CastManager />} */}
        {activeTab === 'users' && <UserManager />}
      </div>
    </div>
  );
}

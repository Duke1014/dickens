import { useEffect, useState } from 'react';
import Login from '../components/Login';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserByEmail } from '../lib/firebaseAdmin';

export default function CompanyPortal() {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, async (u) => {
            setLoading(true);
            if (!u) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }
            setUser(u);
            try {
                const profile = await getUserByEmail(u.email || '');
                setRole(profile?.role || null);
            } catch (err) {
                console.error('Failed to load profile', err);
                setRole(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, []);

    async function handleLogout() {
        const auth = getAuth();
        await signOut(auth);
        setUser(null);
        setRole(null);
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="company-portal">
            {user ? (
                <div>
                    <p>Welcome, {user.email}</p>
                    <p>Role: {role || 'none'}</p>
                    <button className="btn btn-primary" onClick={handleLogout}>Sign out</button>
                    {role === 'admin' && (
                        <div style={{ marginTop: 12 }}>
                            <a href="/admin">Go to Admin Dashboard</a>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <Login />
                </div>
            )}
        </div>
    )
}
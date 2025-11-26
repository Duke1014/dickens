import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail, addUser, updateUser } from '../lib/firebaseAdmin';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleLogin(e?: React.FormEvent) {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const auth = getAuth();
            // log auth config for debugging (will include apiKey if initialized)
            // DO NOT commit logs that expose secrets
            // eslint-disable-next-line no-console
            console.log('auth app options:', (auth as any).app?.options);
            const cred = await signInWithEmailAndPassword(auth, email, password);
            // eslint-disable-next-line no-console
            console.log('cred: ', cred);
            const user = cred.user;

            // Check Firestore user role
            const profile = await getUserByEmail(user.email || '');

            // Determine admin emails from environment variable (comma-separated)
            // e.g. REACT_APP_ADMIN_EMAILS=admin@example.com,owner@example.com
            const adminEmailsEnv = process.env.REACT_APP_ADMIN_EMAILS || '';
            const adminEmails = adminEmailsEnv
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);

            const isAdminEmail = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;

            if (isAdminEmail) {
                // Ensure there's a users document and that it has role 'admin'
                try {
                    if (profile && profile.id) {
                        if (profile.role !== 'admin') {
                            await updateUser(profile.id, { role: 'admin' });
                        }
                    } else {
                        await addUser({ email: user.email || '', name: user.displayName || '', role: 'admin' });
                    }
                } catch (err) {
                    // non-fatal: log and continue to navigation
                    // eslint-disable-next-line no-console
                    console.error('Failed to ensure admin role for user:', err);
                }

                navigate('/admin');
            } else {
                const role = profile?.role || null;
                if (role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/company-portal');
                }
            }
        } catch (err: any) {
            // Log full error for diagnosis and show code+message to the UI
            // eslint-disable-next-line no-console
            console.error('Sign-in error', err);
            const code = err?.code || 'unknown_error';
            const message = err?.message || 'Sign-in failed';
            setError(`${code}: ${message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleLogin} className="form">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
                {error && <div className="error-message">{error}</div>}
            </form>
        </div>
    )
}
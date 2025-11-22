import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail } from '../lib/firebaseAdmin';

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
            const role = profile?.role || null;

            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/company-portal');
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
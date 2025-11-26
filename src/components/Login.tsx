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

            // Determine whether the signed-in user has an admin custom claim.
            // If so, make sure their users document reflects admin status and
            // do NOT downgrade an existing admin. New users created client-side
            // will be 'cast' unless the backend has set an admin claim.
            const profile = await getUserByEmail(user.email || '');
            let isAdminClaim = false;
            try {
                const idTokenResult = await user.getIdTokenResult();
                isAdminClaim = !!(idTokenResult?.claims && (idTokenResult.claims.admin || idTokenResult.claims.isAdmin));
            } catch (err) {
                // ignore token errors; we'll rely on stored role if available
                // eslint-disable-next-line no-console
                console.warn('Could not read id token claims:', err);
            }

            try {
                if (profile) {
                    // If backend claim says admin but profile isn't admin, promote it.
                    if (isAdminClaim && profile.role !== 'admin') {
                        await updateUser(profile.id!, { role: 'admin' });
                    }
                    // If profile exists, respect its role (don't downgrade admins).
                } else {
                    // No profile exists yet: create one. If claim says admin, create as admin,
                    // otherwise create as cast.
                    await addUser({
                        email: user.email || '',
                        name: user.displayName || '',
                        role: isAdminClaim ? 'admin' : 'cast',
                        years: [],
                    });
                }
            } catch (err) {
                // non-fatal: log and continue
                // eslint-disable-next-line no-console
                console.error('Failed to ensure user document role:', err);
            }

            // Final role decision: prefer backend custom claim if present, else stored role.
            const finalProfile = await getUserByEmail(user.email || '');
            const finalRole = isAdminClaim ? 'admin' : (finalProfile?.role || 'cast');
            if (finalRole === 'admin') {
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
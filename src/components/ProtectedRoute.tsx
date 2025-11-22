import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User, getAuth } from 'firebase/auth';
import { getUserByEmail } from '../lib/firebaseAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cast' | 'user';
}

export default function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<{
    loading: boolean;
    user: User | null;
    userRole: string | null;
    authorized: boolean;
  }>({
    loading: true,
    user: null,
    userRole: null,
    authorized: false,
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState({ loading: false, user: null, userRole: null, authorized: false });
        return;
      }

      try {
        // Get user profile from Firestore to check role
        const userProfile = await getUserByEmail(firebaseUser.email!);
        const userRole = userProfile?.role || null;
        const authorized = userRole === requiredRole;

        setAuthState({
          loading: false,
          user: firebaseUser,
          userRole,
          authorized,
        });
      } catch (err) {
        console.error('Error checking user role:', err);
        setAuthState({ loading: false, user: firebaseUser, userRole: null, authorized: false });
      }
    });

    return () => unsubscribe();
  }, [requiredRole]);

  if (authState.loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>;
  }

  if (!authState.user) {
    return <Navigate to="/" replace />;
  }

  if (!authState.authorized) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Required role: {requiredRole}</p>
        <p>Your role: {authState.userRole || 'none'}</p>
      </div>
    );
  }

  return <>{children}</>;
}

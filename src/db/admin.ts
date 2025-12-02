import { auth, db } from '../firebase';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserByEmail } from '../lib/firebaseAdmin';


export async function checkAdminStatus() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user?.email) {
        const profile = await getUserByEmail(user.email);
        const adminStatus = profile?.role === 'admin';
        console.log('Admin check for', user.email, ':', adminStatus, 'role:', profile?.role);
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
}

/**
 * Checks if the current user is an admin.
 * Returns a Promise<boolean>.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user?.email) return false;
    const profile = await getUserByEmail(user.email);
    return profile?.role === 'admin';
  } catch (err) {
    console.error('Admin check failed:', err);
    return false;
  }
}

/**
 * Checks if a given email is an admin.
 * Returns a Promise<boolean>.
 */
export async function isEmailAdmin(email: string): Promise<boolean> {
  try {
    const profile = await getUserByEmail(email);
    return profile?.role === 'admin';
  } catch (err) {
    console.error('Admin check failed:', err);
    return false;
  }
}
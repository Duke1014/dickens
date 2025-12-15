import { auth, db } from '../firebase';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore';

export interface UserProfile {
	uid: string;
	email?: string | null;
	firstname?: string | null;
	lastname?: string | null;
	// add any application-specific fields below
	roles?: string[];
	[key: string]: any;
}

/**
 * Create a new user with email and password, and create a user document in Firestore.
 * Returns the created Firebase user credential's user.
 */
export async function signUpWithEmail(
	email: string,
	password: string,
	profile: Partial<UserProfile> = {}
): Promise<FirebaseUser> {
	const credential = await createUserWithEmailAndPassword(auth, email, password);
	const user = credential.user;

	// Create a Firestore document for the user
	// Prefer profile values; otherwise infer from Firebase user displayName
	const displayNameParts = user.displayName ? user.displayName.split(' ') : [];
	const inferredFirst = profile.firstname ?? (displayNameParts.length ? displayNameParts.shift() || null : null);
	const inferredLast = profile.lastname ?? (displayNameParts.length ? displayNameParts.join(' ') : null);

	const userDoc: UserProfile = {
		uid: user.uid,
		email: user.email,
		firstname: inferredFirst ?? null,
		lastname: inferredLast ?? null,
		roles: profile.roles ?? ['user'],
		...profile,
	};

	await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
	return user;
}

/**
 * Sign in an existing user with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
	const credential = await signInWithEmailAndPassword(auth, email, password);
	return credential.user;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
	return firebaseSignOut(auth);
}

/**
 * Subscribe to Firebase Auth state changes.
 * Returns the unsubscribe function.
 */
export function onAuthStateChangedListener(
	callback: (user: FirebaseUser | null) => void
) {
	return onAuthStateChanged(auth, callback);
}

/**
 * Helper that resolves with the current user (or null) once Auth initializes.
 */
export function getCurrentUser(): Promise<FirebaseUser | null> {
	return new Promise((resolve, reject) => {
		const unsubscribe = onAuthStateChanged(
			auth,
			(user) => {
				unsubscribe();
				resolve(user);
			},
			(error) => {
				unsubscribe();
				reject(error);
			}
		);
	});
}

/**
 * Read a user's profile document from Firestore. Returns null if missing.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
	const snap = await getDoc(doc(db, 'users', uid));
	if (!snap.exists()) return null;
	return snap.data() as UserProfile;
}

/**
 * Set or update the user's profile document in Firestore.
 */
export async function setUserProfile(uid: string, data: Partial<UserProfile>) {
	const docRef = doc(db, 'users', uid);
	await setDoc(docRef, data as DocumentData, { merge: true });
}

export default {
	signUpWithEmail,
	signInWithEmail,
	signOut,
	onAuthStateChangedListener,
	getCurrentUser,
	getUserProfile,
	setUserProfile,
};


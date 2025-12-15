import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
//   QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Firestore collection schemas
 */

export interface CastMember {
  id?: string;
  email?: string;
  // Support separate first/last name fields for easier sorting. Keep `name` for backward compatibility.
  name?: string;
  firstname?: string | null;
  lastname?: string | null;
  role: 'admin' | 'cast';
  years?: number[];
  bio?: string;
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GalleryPhoto {
  id?: string;
  url: string;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CastPhoto extends GalleryPhoto {
  castMemberId: string;
}

// AppUser merged into CastMember

/**
 * Cast member operations
 */

export async function addCastMember(member: CastMember): Promise<string> {
  // Store cast members in the unified 'users' collection. Ensure role defaults to 'cast'.
  const docRef = await addDoc(collection(db, 'users'), {
    ...member,
    role: member.role || 'cast',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateCastMember(id: string, updates: Partial<CastMember>): Promise<void> {
  const memberRef = doc(db, 'users', id);
  await updateDoc(memberRef, {
    ...updates,
    // enforce role stays 'cast' unless explicitly changed by backend/admin
    ...(updates.role ? { role: updates.role } : {}),
    updatedAt: new Date(),
  });
}

export async function deleteCastMember(id: string): Promise<void> {
  const memberRef = doc(db, 'users', id);
  await deleteDoc(memberRef);
}

export async function getCastMembers(): Promise<CastMember[]> {
  // Query the unified 'users' collection for entries with role == 'cast'
  const q = query(collection(db, 'users'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CastMember[];
}

export async function getCastMember(id: string): Promise<CastMember | null> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as CastMember;
  // ensure we only treat role=='cast' as a cast member
  return data.role === 'cast' ? ({ id: docSnap.id, ...data } as CastMember) : null;
}

/**
 * Gallery photo operations (general gallery)
 */

export async function addGalleryPhoto(photo: GalleryPhoto): Promise<string> {
  const docRef = await addDoc(collection(db, 'gallery'), {
    ...photo,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateGalleryPhoto(id: string, updates: Partial<GalleryPhoto>): Promise<void> {
  const photoRef = doc(db, 'gallery', id);
  await updateDoc(photoRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const photoRef = doc(db, 'gallery', id);
  await deleteDoc(photoRef);
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const querySnapshot = await getDocs(collection(db, 'gallery'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GalleryPhoto[];
}

/**
 * Cast photos operations
 */

export async function addCastPhoto(photo: CastPhoto): Promise<string> {
  const docRef = await addDoc(collection(db, 'castPhotos'), {
    ...photo,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function deleteCastPhoto(id: string): Promise<void> {
  const photoRef = doc(db, 'castPhotos', id);
  await deleteDoc(photoRef);
}

/**
 * Delete castPhotos documents for a cast member. If `url` is provided, only delete
 * photos matching that url; otherwise delete all photos for the member.
 */
export async function deleteCastPhotosForMember(castMemberId: string, url?: string): Promise<void> {
  let q;
  if (url) {
    q = query(
      collection(db, 'castPhotos'),
      where('castMemberId', '==', castMemberId),
      where('url', '==', url)
    );
  } else {
    q = query(collection(db, 'castPhotos'), where('castMemberId', '==', castMemberId));
  }
  const snaps = await getDocs(q);
  const deletes: Promise<void>[] = [];
  snaps.docs.forEach((d) => {
    deletes.push(deleteDoc(doc(db, 'castPhotos', d.id)));
  });
  await Promise.all(deletes);
}

export async function getCastPhotos(castMemberId: string): Promise<CastPhoto[]> {
  const q = query(
    collection(db, 'castPhotos'),
    where('castMemberId', '==', castMemberId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CastPhoto[];
}

/**
 * User management operations (company portal)
 */

export async function addUser(user: CastMember): Promise<string> {
  const docRef = await addDoc(collection(db, 'users'), {
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateUser(id: string, updates: Partial<CastMember>): Promise<void> {
  const userRef = doc(db, 'users', id);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteUser(id: string): Promise<void> {
  const userRef = doc(db, 'users', id);
  await deleteDoc(userRef);
}

export async function getUsers(role?: string): Promise<CastMember[]> {
  let q;
  if (role) {
    q = query(collection(db, 'users'), where('role', '==', role));
  } else {
    q = query(collection(db, 'users'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CastMember[];
}

export async function getUserByEmail(email: string): Promise<CastMember | null> {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as CastMember;
}

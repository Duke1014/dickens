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
  name: string;
  role: string;
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

export interface AppUser {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'cast' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cast member operations
 */

export async function addCastMember(member: CastMember): Promise<string> {
  const docRef = await addDoc(collection(db, 'cast'), {
    ...member,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateCastMember(id: string, updates: Partial<CastMember>): Promise<void> {
  const memberRef = doc(db, 'cast', id);
  await updateDoc(memberRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteCastMember(id: string): Promise<void> {
  const memberRef = doc(db, 'cast', id);
  await deleteDoc(memberRef);
}

export async function getCastMembers(): Promise<CastMember[]> {
  const querySnapshot = await getDocs(collection(db, 'cast'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CastMember[];
}

export async function getCastMember(id: string): Promise<CastMember | null> {
  const docRef = doc(db, 'cast', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as CastMember) : null;
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

export async function addUser(user: AppUser): Promise<string> {
  const docRef = await addDoc(collection(db, 'users'), {
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
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

export async function getUsers(role?: string): Promise<AppUser[]> {
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
  })) as AppUser[];
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AppUser;
}

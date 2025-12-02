import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Announcement {
  id?: string;
  title: string;
  message: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function addAnnouncement(title: string, message: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'announcements'), {
    title,
    message,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const querySnapshot = await getDocs(collection(db, 'announcements'));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Announcement[];
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const announcementRef = doc(db, 'announcements', id);
  await updateDoc(announcementRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const announcementRef = doc(db, 'announcements', id);
  await deleteDoc(announcementRef);
}

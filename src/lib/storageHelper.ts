import { storage } from '../firebase';
import { getAuth } from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from 'firebase/storage';

/**
 * Upload a headshot photo for a cast member to Firebase Storage.
 * Stores in: /headshots/{userId}/{filename}
 * Returns the public download URL.
 */
export async function uploadHeadshot(
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File must be smaller than ${maxSizeMB}MB`);
  }

  // Sanitize filename (remove or replace spaces and control chars)
  const safeFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  // Create a reference path: headshots/{userId}/filename
  const timestamp = Date.now();
  const storagePath = `headshots/${userId}/${timestamp}-${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  // Log helpful debug info to aid troubleshooting if uploads fail due to rules
  try {
    const auth = getAuth();
    console.debug('Uploading headshot', { storageBucket: (storage as any).bucket || '(unknown)', currentUserUid: auth.currentUser?.uid });
  } catch (err) {
    console.debug('Uploading headshot (could not get auth info)', err);
  }

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get and return the public download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete a headshot photo from Firebase Storage.
 * Expects a full download URL or storage path.
 */
export async function deleteHeadshot(downloadURL: string): Promise<void> {
  if (!downloadURL) return;

  try {
    // Extract the path from the URL if it's a full download URL
    let pathToDelete = downloadURL;

    // If it's a Firebase download URL, extract the encoded path
    if (downloadURL.includes('firebasestorage.googleapis.com')) {
      // Download URLs look like: https://.../o/{encoded-path}?...
      const urlParams = new URL(downloadURL);
      const encodedPath = urlParams.pathname.split('/o/')[1];
      if (encodedPath) {
        pathToDelete = decodeURIComponent(encodedPath);
      }
    }

    const storageRef = ref(storage, pathToDelete);
    await deleteObject(storageRef);
  } catch (err) {
    // If file doesn't exist, that's okay—log warning but don't throw
    console.warn('Failed to delete headshot (may not exist):', err);
  }
}

/**
 * Replace a headshot for a cast member.
 * Deletes the old photo (if present) and uploads the new one.
 */
export async function replaceHeadshot(
  userId: string,
  newFile: File,
  oldDownloadURL?: string
): Promise<string> {
  // Delete the old photo first (if it exists)
  if (oldDownloadURL) {
    await deleteHeadshot(oldDownloadURL);
  }

  // Upload the new photo
  return uploadHeadshot(userId, newFile);
}

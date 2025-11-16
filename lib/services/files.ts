import {
  createDocument,
  getDocument,
  updateDocument,
  queryCollection,
  orderBy,
  where,
} from '../firebase/firestore';
import { RawFile, FirestoreRawFile } from '../schemas';
import { Timestamp } from 'firebase/firestore';
import { uploadFile, getFileDownloadURL, deleteFile as deleteStorageFile } from '../firebase/storage';
import { getCurrentUser } from '../firebase/auth';

export const createRawFile = async (
  userId: string,
  fileData: Omit<RawFile, 'metadata'>
): Promise<string> => {
  const rawFile = {
    ...fileData,
    metadata: {
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  };
  
  return await createDocument(userId, 'rawFiles', rawFile);
};

export const getRawFile = async (
  userId: string,
  fileId: string
): Promise<FirestoreRawFile | null> => {
  return await getDocument<FirestoreRawFile>(userId, 'rawFiles', fileId);
};

export const updateRawFile = async (
  userId: string,
  fileId: string,
  updates: Partial<Omit<RawFile, 'metadata'>>
): Promise<void> => {
  await updateDocument(userId, 'rawFiles', fileId, updates);
};

export const getAllRawFiles = async (userId: string): Promise<FirestoreRawFile[]> => {
  return await queryCollection<FirestoreRawFile>(
    userId,
    'rawFiles',
    [orderBy('metadata.created_at', 'desc')]
  );
};

export const getRawFilesByStatus = async (
  userId: string,
  status: RawFile['status']
): Promise<FirestoreRawFile[]> => {
  return await queryCollection<FirestoreRawFile>(
    userId,
    'rawFiles',
    [
      where('status', '==', status),
      orderBy('metadata.created_at', 'desc'),
    ]
  );
};

export const uploadFileToStorage = async (
  file: Blob | Uint8Array | ArrayBuffer,
  filename: string,
  accountId?: string,
  onProgress?: (progress: number) => void
): Promise<{ storagePath: string; downloadURL: string }> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to upload files');
  }
  
  const userId = user.uid;
  const timestamp = Date.now();
  const filePath = accountId 
    ? `statements/${accountId}/${timestamp}_${filename}`
    : `receipts/${timestamp}_${filename}`;
  
  const uploadTask = uploadFile(userId, filePath, file, onProgress);
  await uploadTask;
  
  const downloadURL = await getFileDownloadURL(userId, filePath);
  
  return {
    storagePath: filePath,
    downloadURL,
  };
};

export const deleteFile = async (
  userId: string,
  fileId: string
): Promise<void> => {
  const rawFile = await getRawFile(userId, fileId);
  if (rawFile && rawFile.storage_path) {
    await deleteStorageFile(userId, rawFile.storage_path);
  }
  // Note: We don't delete the Firestore document here as it might be referenced elsewhere
  // The document should be deleted separately if needed
};


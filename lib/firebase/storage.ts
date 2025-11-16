import { storage } from './config';
import { 
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
  StorageReference
} from 'firebase/storage';
import { logger } from '../utils/logger';

// Helper to get user-scoped storage reference
export const getUserStorageRef = (userId: string, path: string): StorageReference => {
  return ref(storage, `users/${userId}/${path}`);
};

// Upload file with progress tracking
export const uploadFile = (
  userId: string,
  filePath: string,
  file: Blob | Uint8Array | ArrayBuffer,
  onProgress?: (progress: number) => void
): UploadTask => {
  const fileSize = file instanceof Blob ? file.size : (file as ArrayBuffer).byteLength;
  logger.logStorageRequest('upload', userId, filePath, { 
    fileSize: `${(fileSize / 1024).toFixed(2)}KB` 
  });
  
  const storageRef = getUserStorageRef(userId, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  const startTime = Date.now();
  
  if (onProgress) {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        const duration = Date.now() - startTime;
        logger.logStorageError('upload', userId, filePath, error as Error, { duration: `${duration}ms` });
      },
      () => {
        const duration = Date.now() - startTime;
        logger.logStorageResponse('upload', userId, filePath, duration, { 
          fileSize: `${(fileSize / 1024).toFixed(2)}KB` 
        });
      }
    );
  } else {
    uploadTask.then(
      () => {
        const duration = Date.now() - startTime;
        logger.logStorageResponse('upload', userId, filePath, duration, { 
          fileSize: `${(fileSize / 1024).toFixed(2)}KB` 
        });
      },
      (error) => {
        const duration = Date.now() - startTime;
        logger.logStorageError('upload', userId, filePath, error as Error, { duration: `${duration}ms` });
      }
    );
  }
  
  return uploadTask;
};

// Get download URL for a file
export const getFileDownloadURL = async (userId: string, filePath: string): Promise<string> => {
  const startTime = Date.now();
  logger.logStorageRequest('getDownloadURL', userId, filePath);
  
  try {
    const storageRef = getUserStorageRef(userId, filePath);
    const url = await getDownloadURL(storageRef);
    
    const duration = Date.now() - startTime;
    logger.logStorageResponse('getDownloadURL', userId, filePath, duration);
    
    return url;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logStorageError('getDownloadURL', userId, filePath, error as Error);
    throw error;
  }
};

// Delete file from storage
export const deleteFile = async (userId: string, filePath: string): Promise<void> => {
  const startTime = Date.now();
  logger.logStorageRequest('delete', userId, filePath);
  
  try {
    const storageRef = getUserStorageRef(userId, filePath);
    await deleteObject(storageRef);
    
    const duration = Date.now() - startTime;
    logger.logStorageResponse('delete', userId, filePath, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logStorageError('delete', userId, filePath, error as Error);
    throw error;
  }
};

export { storage };


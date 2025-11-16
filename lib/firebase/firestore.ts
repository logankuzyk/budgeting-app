import { db } from './config';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { logger } from '../utils/logger';

// Re-export query helpers
export { where, orderBy, limit };

// Helper to get user-scoped collection reference
export const getUserCollection = (userId: string, collectionName: string): CollectionReference => {
  return collection(db, 'users', userId, collectionName);
};

// Helper to get user-scoped document reference
export const getUserDocument = (userId: string, collectionName: string, docId: string): DocumentReference => {
  return doc(db, 'users', userId, collectionName, docId);
};

// Helper to convert Firestore Timestamp to Date
export const timestampToDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
};

// Helper to convert Date to Firestore Timestamp
export const dateToTimestamp = (date: Date | null | undefined): Timestamp | null => {
  if (!date) return null;
  return Timestamp.fromDate(date);
};

// Generic CRUD operations
export const createDocument = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> => {
  const startTime = Date.now();
  logger.logFirestoreRequest('create', userId, collectionName, docId, { dataKeys: Object.keys(data) });
  
  try {
    const docRef = docId 
      ? getUserDocument(userId, collectionName, docId)
      : doc(getUserCollection(userId, collectionName));
    
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    const duration = Date.now() - startTime;
    logger.logFirestoreResponse('create', userId, collectionName, duration, docRef.id);
    
    return docRef.id;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFirestoreError('create', userId, collectionName, error as Error, docId);
    throw error;
  }
};

export const getDocument = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const startTime = Date.now();
  logger.logFirestoreRequest('get', userId, collectionName, docId);
  
  try {
    const docRef = getUserDocument(userId, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    const duration = Date.now() - startTime;
    
    if (docSnap.exists()) {
      logger.logFirestoreResponse('get', userId, collectionName, duration, docId, 1);
      return docSnap.data() as T;
    }
    
    logger.logFirestoreResponse('get', userId, collectionName, duration, docId, 0, { exists: false });
    return null;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFirestoreError('get', userId, collectionName, error as Error, docId);
    throw error;
  }
};

export const updateDocument = async <T extends Partial<DocumentData>>(
  userId: string,
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  const startTime = Date.now();
  logger.logFirestoreRequest('update', userId, collectionName, docId, { updateKeys: Object.keys(data) });
  
  try {
    const docRef = getUserDocument(userId, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    
    const duration = Date.now() - startTime;
    logger.logFirestoreResponse('update', userId, collectionName, duration, docId);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFirestoreError('update', userId, collectionName, error as Error, docId);
    throw error;
  }
};

export const deleteDocument = async (
  userId: string,
  collectionName: string,
  docId: string
): Promise<void> => {
  const startTime = Date.now();
  logger.logFirestoreRequest('delete', userId, collectionName, docId);
  
  try {
    const docRef = getUserDocument(userId, collectionName, docId);
    await deleteDoc(docRef);
    
    const duration = Date.now() - startTime;
    logger.logFirestoreResponse('delete', userId, collectionName, duration, docId);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFirestoreError('delete', userId, collectionName, error as Error, docId);
    throw error;
  }
};

export const queryCollection = async <T extends DocumentData>(
  userId: string,
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> => {
  const startTime = Date.now();
  logger.logFirestoreRequest('query', userId, collectionName, undefined, { 
    constraintCount: constraints.length,
    constraints: constraints.map(c => {
      // Extract constraint info for logging
      if ('_query' in c && '_fieldPath' in c) {
        return { type: 'orderBy', field: (c as any)._fieldPath?.internalPath?.segments?.[0] };
      }
      if ('_fieldPath' in c && '_op' in c) {
        return { type: 'where', field: (c as any)._fieldPath?.internalPath?.segments?.[0], op: (c as any)._op };
      }
      return { type: 'unknown' };
    })
  });
  
  try {
    const q = query(getUserCollection(userId, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];
    
    const duration = Date.now() - startTime;
    logger.logFirestoreResponse('query', userId, collectionName, duration, undefined, results.length);
    
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFirestoreError('query', userId, collectionName, error as Error);
    throw error;
  }
};

// Real-time subscription helper
export const subscribeToCollection = <T extends DocumentData>(
  userId: string,
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: (T & { id: string })[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  logger.logFirestoreRequest('subscribe', userId, collectionName, undefined, { 
    constraintCount: constraints.length 
  });
  
  const q = query(getUserCollection(userId, collectionName), ...constraints);
  
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (T & { id: string })[];
      
      logger.debug(`Firestore subscription update for ${collectionName}`, {
        service: 'firestore',
        operation: 'subscribe',
        userId,
        collection: collectionName,
        resultCount: data.length,
        fromCache: snapshot.metadata.fromCache,
      });
      
      callback(data);
    },
    (error) => {
      logger.logFirestoreError('subscribe', userId, collectionName, error as Error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
};

export { db };


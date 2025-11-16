import { 
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  getUserCollection,
  orderBy,
  where,
} from '../firebase/firestore';
import { Account, FirestoreAccount } from '../schemas';
import { Timestamp } from 'firebase/firestore';
import { dateToTimestamp } from '../firebase/firestore';

export const createAccount = async (
  userId: string,
  accountData: Omit<Account, 'metadata'>
): Promise<string> => {
  const now = Timestamp.now();
  const account = {
    ...accountData,
    metadata: {
      created_at: now,
      updated_at: now,
    },
  };
  
  return await createDocument(userId, 'accounts', account);
};

export const getAccount = async (
  userId: string,
  accountId: string
): Promise<FirestoreAccount | null> => {
  return await getDocument<FirestoreAccount>(userId, 'accounts', accountId);
};

export const updateAccount = async (
  userId: string,
  accountId: string,
  updates: Partial<Omit<Account, 'metadata'>>
): Promise<void> => {
  await updateDocument(userId, 'accounts', accountId, updates);
};

export const deleteAccount = async (
  userId: string,
  accountId: string
): Promise<void> => {
  await deleteDocument(userId, 'accounts', accountId);
};

export const getAllAccounts = async (userId: string): Promise<FirestoreAccount[]> => {
  return await queryCollection<FirestoreAccount>(
    userId,
    'accounts',
    [orderBy('name', 'asc')]
  );
};

export const getAccountsByType = async (
  userId: string,
  type: Account['type']
): Promise<FirestoreAccount[]> => {
  return await queryCollection<FirestoreAccount>(
    userId,
    'accounts',
    [where('type', '==', type), orderBy('name', 'asc')]
  );
};


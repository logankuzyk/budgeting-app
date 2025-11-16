import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  orderBy,
  where,
  limit,
} from '../firebase/firestore';
import { Transaction, FirestoreTransaction } from '../schemas';
import { Timestamp, QueryConstraint } from 'firebase/firestore';

export const createTransaction = async (
  userId: string,
  transactionData: Omit<Transaction, 'metadata'>
): Promise<string> => {
  const transaction = {
    ...transactionData,
    date: transactionData.date instanceof Date 
      ? Timestamp.fromDate(transactionData.date)
      : transactionData.date,
    metadata: {
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  };
  
  return await createDocument(userId, 'transactions', transaction);
};

export const getTransaction = async (
  userId: string,
  transactionId: string
): Promise<FirestoreTransaction | null> => {
  return await getDocument<FirestoreTransaction>(userId, 'transactions', transactionId);
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<Omit<Transaction, 'metadata'>>
): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = updates.date instanceof Date
      ? Timestamp.fromDate(updates.date)
      : updates.date;
  }
  await updateDocument(userId, 'transactions', transactionId, updateData);
};

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  await deleteDocument(userId, 'transactions', transactionId);
};

export const getTransactionsByAccount = async (
  userId: string,
  accountId: string,
  maxResults?: number
): Promise<FirestoreTransaction[]> => {
  const constraints: QueryConstraint[] = [
    where('account_id', '==', accountId),
    orderBy('date', 'desc'),
  ];
  if (maxResults) {
    constraints.push(limit(maxResults));
  }
  return await queryCollection<FirestoreTransaction>(
    userId,
    'transactions',
    constraints
  );
};

export const getTransactionsByCategory = async (
  userId: string,
  categoryId: string,
  maxResults?: number
): Promise<FirestoreTransaction[]> => {
  const constraints: QueryConstraint[] = [
    where('category_id', '==', categoryId),
    orderBy('date', 'desc'),
  ];
  if (maxResults) {
    constraints.push(limit(maxResults));
  }
  return await queryCollection<FirestoreTransaction>(
    userId,
    'transactions',
    constraints
  );
};

export const getTransactionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FirestoreTransaction[]> => {
  return await queryCollection<FirestoreTransaction>(
    userId,
    'transactions',
    [
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc'),
    ]
  );
};

export const getAllTransactions = async (
  userId: string,
  maxResults?: number
): Promise<FirestoreTransaction[]> => {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
  if (maxResults) {
    constraints.push(limit(maxResults));
  }
  return await queryCollection<FirestoreTransaction>(
    userId,
    'transactions',
    constraints
  );
};


import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  orderBy,
  where,
} from '../firebase/firestore';
import { Receipt, FirestoreReceipt, Item, FirestoreItem } from '../schemas';
import { Timestamp } from 'firebase/firestore';

export const createReceipt = async (
  userId: string,
  receiptData: Omit<Receipt, 'metadata' | 'items'>
): Promise<string> => {
  const receipt = {
    ...receiptData,
    date: receiptData.date instanceof Date
      ? Timestamp.fromDate(receiptData.date)
      : receiptData.date,
    items: [],
    metadata: {
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  };
  
  return await createDocument(userId, 'receipts', receipt);
};

export const getReceipt = async (
  userId: string,
  receiptId: string
): Promise<FirestoreReceipt | null> => {
  return await getDocument<FirestoreReceipt>(userId, 'receipts', receiptId);
};

export const updateReceipt = async (
  userId: string,
  receiptId: string,
  updates: Partial<Omit<Receipt, 'metadata' | 'items'>>
): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = updates.date instanceof Date
      ? Timestamp.fromDate(updates.date)
      : updates.date;
  }
  await updateDocument(userId, 'receipts', receiptId, updateData);
};

export const deleteReceipt = async (
  userId: string,
  receiptId: string
): Promise<void> => {
  await deleteDocument(userId, 'receipts', receiptId);
};

export const getAllReceipts = async (userId: string): Promise<FirestoreReceipt[]> => {
  return await queryCollection<FirestoreReceipt>(
    userId,
    'receipts',
    [orderBy('date', 'desc')]
  );
};

export const getReceiptsByTransaction = async (
  userId: string,
  transactionId: string
): Promise<FirestoreReceipt[]> => {
  return await queryCollection<FirestoreReceipt>(
    userId,
    'receipts',
    [where('transaction_id', '==', transactionId)]
  );
};

export const createReceiptItem = async (
  userId: string,
  receiptId: string,
  itemData: Omit<Item, 'metadata' | 'receipt_id'>
): Promise<string> => {
  const item = {
    ...itemData,
    receipt_id: receiptId,
    metadata: {
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  };
  
  return await createDocument(userId, 'items', item);
};

export const getReceiptItems = async (
  userId: string,
  receiptId: string
): Promise<FirestoreItem[]> => {
  return await queryCollection<FirestoreItem>(
    userId,
    'items',
    [where('receipt_id', '==', receiptId)]
  );
};


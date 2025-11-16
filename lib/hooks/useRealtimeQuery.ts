import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { subscribeToCollection } from '../firebase/firestore';
import { QueryConstraint, DocumentData } from 'firebase/firestore';
import { getCurrentUser } from '../firebase/auth';

// Query keys factory
export const queryKeys = {
  accounts: (userId: string) => ['accounts', userId] as const,
  account: (userId: string, accountId: string) => ['account', userId, accountId] as const,
  transactions: (userId: string, filters?: { accountId?: string; categoryId?: string }) => 
    ['transactions', userId, filters] as const,
  transaction: (userId: string, transactionId: string) => 
    ['transaction', userId, transactionId] as const,
  receipts: (userId: string) => ['receipts', userId] as const,
  receipt: (userId: string, receiptId: string) => ['receipt', userId, receiptId] as const,
  statements: (userId: string, accountId?: string) => 
    ['statements', userId, accountId] as const,
  statement: (userId: string, statementId: string) => 
    ['statement', userId, statementId] as const,
  rawFiles: (userId: string, status?: string) => 
    ['rawFiles', userId, status] as const,
  rawFile: (userId: string, fileId: string) => ['rawFile', userId, fileId] as const,
  categories: (userId: string) => ['categories', userId] as const,
  category: (userId: string, categoryId: string) => ['category', userId, categoryId] as const,
  budgets: (userId: string) => ['budgets', userId] as const,
  budget: (userId: string, budgetId: string) => ['budget', userId, budgetId] as const,
};

// Real-time query hook
export function useRealtimeQuery<T extends DocumentData = DocumentData>(
  queryKey: QueryKey,
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const user = getCurrentUser();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToCollection<T>(
      user.uid,
      collectionName,
      constraints,
      (newData) => {
        setData(newData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in useRealtimeQuery for ${collectionName}:`, err);
        setError(err);
        setIsLoading(false);
        setData([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, collectionName, JSON.stringify(constraints)]);

  return { data, isLoading, error };
}

// Generic mutation hook factory
export function useFirestoreMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateQueries?: QueryKey[]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
  });
}


import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  orderBy,
  where,
} from '../firebase/firestore';
import { Statement, FirestoreStatement } from '../schemas';
import { Timestamp } from 'firebase/firestore';

export const createStatement = async (
  userId: string,
  statementData: Omit<Statement, 'metadata'>
): Promise<string> => {
  const statement = {
    ...statementData,
    period_start: statementData.period_start instanceof Date
      ? Timestamp.fromDate(statementData.period_start)
      : statementData.period_start,
    period_end: statementData.period_end instanceof Date
      ? Timestamp.fromDate(statementData.period_end)
      : statementData.period_end,
    metadata: {
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  };
  
  return await createDocument(userId, 'statements', statement);
};

export const getStatement = async (
  userId: string,
  statementId: string
): Promise<FirestoreStatement | null> => {
  return await getDocument<FirestoreStatement>(userId, 'statements', statementId);
};

export const updateStatement = async (
  userId: string,
  statementId: string,
  updates: Partial<Omit<Statement, 'metadata'>>
): Promise<void> => {
  const updateData: any = { ...updates };
  if (updates.period_start) {
    updateData.period_start = updates.period_start instanceof Date
      ? Timestamp.fromDate(updates.period_start)
      : updates.period_start;
  }
  if (updates.period_end) {
    updateData.period_end = updates.period_end instanceof Date
      ? Timestamp.fromDate(updates.period_end)
      : updates.period_end;
  }
  await updateDocument(userId, 'statements', statementId, updateData);
};

export const deleteStatement = async (
  userId: string,
  statementId: string
): Promise<void> => {
  await deleteDocument(userId, 'statements', statementId);
};

export const getStatementsByAccount = async (
  userId: string,
  accountId: string
): Promise<FirestoreStatement[]> => {
  return await queryCollection<FirestoreStatement>(
    userId,
    'statements',
    [
      where('account_id', '==', accountId),
      orderBy('period_start', 'desc'),
    ]
  );
};

export const getAllStatements = async (userId: string): Promise<FirestoreStatement[]> => {
  return await queryCollection<FirestoreStatement>(
    userId,
    'statements',
    [orderBy('period_start', 'desc')]
  );
};

export interface StatementOverlap {
  statementId: string;
  periodStart: Date;
  periodEnd: Date;
}

export const checkStatementOverlap = async (
  userId: string,
  accountId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<StatementOverlap[]> => {
  const statements = await getStatementsByAccount(userId, accountId);
  const overlaps: StatementOverlap[] = [];
  
  for (const statement of statements) {
    if (!statement.period_start || !statement.period_end) {
      continue;
    }
    
    const stmtStart = statement.period_start instanceof Timestamp
      ? statement.period_start.toDate()
      : statement.period_start instanceof Date
      ? statement.period_start
      : new Date(statement.period_start);
    
    const stmtEnd = statement.period_end instanceof Timestamp
      ? statement.period_end.toDate()
      : statement.period_end instanceof Date
      ? statement.period_end
      : new Date(statement.period_end);
    
    // Check for overlap: periods overlap if start1 < end2 && start2 < end1
    if (periodStart < stmtEnd && stmtStart < periodEnd) {
      overlaps.push({
        statementId: statement.id || '',
        periodStart: stmtStart,
        periodEnd: stmtEnd,
      });
    }
  }
  
  return overlaps;
};


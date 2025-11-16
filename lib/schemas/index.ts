import { z } from 'zod';

// Entity Metadata Schema
export const EntityMetadataSchema = z.object({
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().optional(),
  updated_by: z.string().optional(),
});

export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;

// Account Schema
export const AccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'loan', 'other']),
  institution: z.string().optional(),
  account_number_last4: z.string().length(4).optional(),
  balance: z.number().default(0),
  currency: z.string().length(3).default('USD'),
  metadata: EntityMetadataSchema,
});

export type Account = z.infer<typeof AccountSchema>;

// Category Schema
export const CategorySchema = z.object({
  name: z.string().min(1),
  parent_id: z.string().nullable().optional(),
  type: z.enum(['debit', 'credit']),
  sort_order: z.number().default(0),
  metadata: EntityMetadataSchema,
});

export type Category = z.infer<typeof CategorySchema>;

// Raw File Schema
export const RawFileSchema = z.object({
  filename: z.string(),
  file_type: z.enum(['pdf', 'csv', 'image', 'email']),
  storage_path: z.string(),
  account_id: z.string().nullable().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  error_message: z.string().nullable().optional(),
  metadata: EntityMetadataSchema,
});

export type RawFile = z.infer<typeof RawFileSchema>;

// Statement Schema
export const StatementSchema = z.object({
  account_id: z.string(),
  raw_file_id: z.string(),
  period_start: z.date(),
  period_end: z.date(),
  opening_balance: z.number(),
  closing_balance: z.number(),
  is_validated: z.boolean().default(false),
  validation_errors: z.array(z.string()).default([]),
  metadata: EntityMetadataSchema,
});

export type Statement = z.infer<typeof StatementSchema>;

// Transaction Schema
export const TransactionSchema = z.object({
  account_id: z.string(),
  statement_id: z.string().nullable().optional(),
  date: z.date(),
  amount: z.number(),
  description: z.string(),
  merchant: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  receipt_id: z.string().nullable().optional(),
  is_reconciled: z.boolean().default(false),
  metadata: EntityMetadataSchema,
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Item Schema (for receipt items)
export const ItemSchema = z.object({
  receipt_id: z.string(),
  description: z.string(),
  quantity: z.number().default(1),
  unit_price: z.number(),
  total_price: z.number(),
  category_id: z.string().nullable().optional(),
  metadata: EntityMetadataSchema,
});

export type Item = z.infer<typeof ItemSchema>;

// Receipt Schema
export const ReceiptSchema = z.object({
  raw_file_id: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  date: z.date(),
  merchant: z.string(),
  total_amount: z.number(),
  tax_amount: z.number().default(0),
  items: z.array(ItemSchema).default([]),
  storage_path: z.string().optional(),
  metadata: EntityMetadataSchema,
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// Budget Schema
export const BudgetSchema = z.object({
  category_id: z.string(),
  period_start: z.date(),
  period_end: z.date(),
  amount: z.number(),
  spent: z.number().default(0),
  metadata: EntityMetadataSchema,
});

export type Budget = z.infer<typeof BudgetSchema>;

// Firestore-specific schemas with Timestamp conversions
import { Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamp to Date for Zod
const firestoreTimestampSchema = z.union([
  z.instanceof(Timestamp),
  z.date(),
  z.null(),
]).transform((val) => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return null;
});

// Firestore Account Schema
export const FirestoreAccountSchema = AccountSchema.extend({
  id: z.string().optional(),
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreAccount = z.infer<typeof FirestoreAccountSchema>;

// Firestore Category Schema
export const FirestoreCategorySchema = CategorySchema.extend({
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreCategory = z.infer<typeof FirestoreCategorySchema>;

// Firestore RawFile Schema
export const FirestoreRawFileSchema = RawFileSchema.extend({
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreRawFile = z.infer<typeof FirestoreRawFileSchema>;

// Firestore Statement Schema
export const FirestoreStatementSchema = StatementSchema.extend({
  id: z.string().optional(),
  period_start: firestoreTimestampSchema,
  period_end: firestoreTimestampSchema,
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreStatement = z.infer<typeof FirestoreStatementSchema>;

// Firestore Transaction Schema
export const FirestoreTransactionSchema = TransactionSchema.extend({
  id: z.string().optional(),
  date: firestoreTimestampSchema,
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreTransaction = z.infer<typeof FirestoreTransactionSchema>;

// Firestore Item Schema
export const FirestoreItemSchema = ItemSchema.extend({
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreItem = z.infer<typeof FirestoreItemSchema>;

// Firestore Receipt Schema
export const FirestoreReceiptSchema = ReceiptSchema.extend({
  id: z.string().optional(),
  date: firestoreTimestampSchema,
  items: z.array(FirestoreItemSchema).default([]),
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreReceipt = z.infer<typeof FirestoreReceiptSchema>;

// Firestore Budget Schema
export const FirestoreBudgetSchema = BudgetSchema.extend({
  period_start: firestoreTimestampSchema,
  period_end: firestoreTimestampSchema,
  metadata: EntityMetadataSchema.extend({
    created_at: firestoreTimestampSchema,
    updated_at: firestoreTimestampSchema,
  }),
});

export type FirestoreBudget = z.infer<typeof FirestoreBudgetSchema>;

// Utility functions to convert between regular and Firestore schemas
export const toFirestoreDate = (date: Date | null): Timestamp | null => {
  if (!date) return null;
  return Timestamp.fromDate(date);
};

export const fromFirestoreDate = (timestamp: Timestamp | Date | null): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return null;
};


import { getFirestore } from 'firebase-admin/firestore';

interface DefaultCategoryInput {
  name: string;
  parent_id?: string | null;
  type: 'debit' | 'credit';
  sort_order: number;
}

const defaultCategories: DefaultCategoryInput[] = [
  { name: 'Debits', parent_id: null, type: 'debit', sort_order: 0 },
  { name: 'Transfer In', parent_id: 'Debits', type: 'debit', sort_order: 0 },
  { name: 'Income', parent_id: 'Debits', type: 'debit', sort_order: 1 },
  { name: 'Salary', parent_id: 'Income', type: 'debit', sort_order: 0 },
  { name: 'Freelance', parent_id: 'Income', type: 'debit', sort_order: 1 },
  { name: 'Investment Returns', parent_id: 'Income', type: 'debit', sort_order: 2 },
  { name: 'Other Income', parent_id: 'Income', type: 'debit', sort_order: 3 },
  { name: 'Credits', parent_id: null, type: 'credit', sort_order: 1 },
  { name: 'Transfer Out', parent_id: 'Credits', type: 'credit', sort_order: 0 },
  { name: 'Supplies', parent_id: 'Credits', type: 'credit', sort_order: 1 },
  { name: 'Items', parent_id: 'Credits', type: 'credit', sort_order: 2 },
  { name: 'Food', parent_id: 'Credits', type: 'credit', sort_order: 3 },
  { name: 'Groceries', parent_id: 'Food', type: 'credit', sort_order: 0 },
  { name: 'Restaurants', parent_id: 'Food', type: 'credit', sort_order: 1 },
  { name: 'Transportation', parent_id: 'Credits', type: 'credit', sort_order: 4 },
  { name: 'Gas', parent_id: 'Transportation', type: 'credit', sort_order: 0 },
  { name: 'Public Transit', parent_id: 'Transportation', type: 'credit', sort_order: 1 },
  { name: 'Rideshare', parent_id: 'Transportation', type: 'credit', sort_order: 2 },
  { name: 'Utilities', parent_id: 'Credits', type: 'credit', sort_order: 5 },
  { name: 'Electric', parent_id: 'Utilities', type: 'credit', sort_order: 0 },
  { name: 'Water', parent_id: 'Utilities', type: 'credit', sort_order: 1 },
  { name: 'Internet', parent_id: 'Utilities', type: 'credit', sort_order: 2 },
  { name: 'Phone', parent_id: 'Utilities', type: 'credit', sort_order: 3 },
  { name: 'Housing', parent_id: 'Credits', type: 'credit', sort_order: 6 },
  { name: 'Rent', parent_id: 'Housing', type: 'credit', sort_order: 0 },
  { name: 'Mortgage', parent_id: 'Housing', type: 'credit', sort_order: 1 },
  { name: 'Maintenance', parent_id: 'Housing', type: 'credit', sort_order: 2 },
  { name: 'Subscriptions', parent_id: 'Credits', type: 'credit', sort_order: 7 },
  { name: 'Streaming Services', parent_id: 'Subscriptions', type: 'credit', sort_order: 0 },
  { name: 'Software', parent_id: 'Subscriptions', type: 'credit', sort_order: 1 },
  { name: 'Loan Repayments', parent_id: 'Credits', type: 'credit', sort_order: 8 },
  { name: 'Student Loans', parent_id: 'Loan Repayments', type: 'credit', sort_order: 0 },
  { name: 'Personal Loans', parent_id: 'Loan Repayments', type: 'credit', sort_order: 1 },
  { name: 'Tuition', parent_id: 'Credits', type: 'credit', sort_order: 9 },
  { name: 'Miscellaneous', parent_id: 'Credits', type: 'credit', sort_order: 10 },
];

export async function seedDefaultCategories(userId: string): Promise<void> {
  const db = getFirestore();
  const categoriesRef = db.collection('users').doc(userId).collection('categories');
  
  // Create a map to store category IDs by name for parent references
  const categoryIdMap: Map<string, string> = new Map();
  
  // First pass: Create all categories and store their IDs
  for (const category of defaultCategories) {
    const categoryData = {
      name: category.name,
      parent_id: null as string | null,
      type: category.type,
      sort_order: category.sort_order,
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
    
    const docRef = await categoriesRef.add(categoryData);
    categoryIdMap.set(category.name, docRef.id);
  }
  
  // Second pass: Update parent_id references
  for (const category of defaultCategories) {
    if (category.parent_id) {
      const categoryId = categoryIdMap.get(category.name);
      const parentId = categoryIdMap.get(category.parent_id);
      
      if (categoryId && parentId) {
        await categoriesRef.doc(categoryId).update({
          parent_id: parentId,
        });
      }
    }
  }
}

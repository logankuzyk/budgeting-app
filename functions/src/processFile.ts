import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { extractStatementData, extractReceiptData } from './gemini';
import { Timestamp } from 'firebase-admin/firestore';

interface RawFileData {
  filename: string;
  file_type: 'pdf' | 'csv' | 'image' | 'email';
  storage_path: string;
  account_id?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export async function processFile(
  userId: string,
  fileId: string,
  rawFileData: RawFileData
): Promise<void> {
  const db = getFirestore();
  const storage = getStorage();
  const bucket = storage.bucket();
  
  // Update status to processing
  await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
    status: 'processing',
    updated_at: Timestamp.now(),
  });

  try {
    // Get file from storage
    // Storage path in rawFile is relative (e.g., "statements/{accountId}/{filename}")
    // But actual storage path includes user prefix: "users/{userId}/statements/{accountId}/{filename}"
    const fullStoragePath = `users/${userId}/${rawFileData.storage_path}`;
    const file = bucket.file(fullStoragePath);
    const [fileBuffer] = await file.download();
    
    // Handle file content based on file type
    let fileContent: string;
    if (rawFileData.file_type === 'pdf') {
      // For PDFs, convert to base64 for Gemini API
      fileContent = fileBuffer.toString('base64');
    } else {
      // For CSV and other text files, use UTF-8
      fileContent = fileBuffer.toString('utf-8');
    }

    // Get user's Gemini API key
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const apiKey = userData?.geminiApiKey;

    if (!apiKey) {
      throw new Error('Gemini API key not found for user');
    }

    // Determine file type and extract data
    if (rawFileData.file_type === 'pdf' || rawFileData.file_type === 'csv') {
      // Process as statement if account_id is provided
      if (rawFileData.account_id) {
        const extractedData = await extractStatementData(
          fileContent,
          rawFileData.file_type,
          apiKey
        );

        // Create statement document
        const statementData = {
          account_id: rawFileData.account_id,
          raw_file_id: fileId,
          period_start: Timestamp.fromDate(new Date(extractedData.period_start)),
          period_end: Timestamp.fromDate(new Date(extractedData.period_end)),
          opening_balance: extractedData.opening_balance,
          closing_balance: extractedData.closing_balance,
          is_validated: false,
          validation_errors: [],
          metadata: {
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          },
        };

        const statementRef = await db
          .collection('users')
          .doc(userId)
          .collection('statements')
          .add(statementData);

        // Create transaction documents
        const batch = db.batch();
        for (const transaction of extractedData.transactions) {
          const transactionRef = db
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .doc();
          
          batch.set(transactionRef, {
            account_id: rawFileData.account_id,
            statement_id: statementRef.id,
            date: Timestamp.fromDate(new Date(transaction.date)),
            amount: transaction.amount,
            description: transaction.description,
            merchant: transaction.merchant || null,
            category_id: null,
            receipt_id: null,
            is_reconciled: false,
            metadata: {
              created_at: Timestamp.now(),
              updated_at: Timestamp.now(),
            },
          });
        }
        await batch.commit();
      }
    } else if (rawFileData.file_type === 'image') {
      // Process as receipt
      const extractedData = await extractReceiptData(
        fileContent,
        rawFileData.file_type,
        apiKey
      );

      // Create receipt document
      const receiptData = {
        raw_file_id: fileId,
        transaction_id: null,
        date: Timestamp.fromDate(new Date(extractedData.date)),
        merchant: extractedData.merchant,
        total_amount: extractedData.total_amount,
        tax_amount: extractedData.tax_amount || 0,
        items: [],
        storage_path: rawFileData.storage_path,
        metadata: {
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        },
      };

      const receiptRef = await db
        .collection('users')
        .doc(userId)
        .collection('receipts')
        .add(receiptData);

      // Create item documents
      const batch = db.batch();
      for (const item of extractedData.items) {
        const itemRef = db
          .collection('users')
          .doc(userId)
          .collection('items')
          .doc();
        
        batch.set(itemRef, {
          receipt_id: receiptRef.id,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.total_price,
          total_price: item.total_price,
          category_id: null,
          metadata: {
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          },
        });
      }
      await batch.commit();
    }

    // Update status to completed
    await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
      status: 'completed',
      updated_at: Timestamp.now(),
    });
  } catch (error) {
    // Update status to failed
    await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      updated_at: Timestamp.now(),
    });
    throw error;
  }
}

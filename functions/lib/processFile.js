"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFile = processFile;
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const gemini_1 = require("./gemini");
const firestore_2 = require("firebase-admin/firestore");
async function processFile(userId, fileId, rawFileData) {
    const db = (0, firestore_1.getFirestore)();
    const storage = (0, storage_1.getStorage)();
    const bucket = storage.bucket();
    // Update status to processing
    await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
        status: 'processing',
        updated_at: firestore_2.Timestamp.now(),
    });
    try {
        // Get file from storage
        const file = bucket.file(rawFileData.storage_path);
        const [fileBuffer] = await file.download();
        const fileContent = fileBuffer.toString('utf-8');
        // Get user's Gemini API key
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const apiKey = userData === null || userData === void 0 ? void 0 : userData.geminiApiKey;
        if (!apiKey) {
            throw new Error('Gemini API key not found for user');
        }
        // Determine file type and extract data
        if (rawFileData.file_type === 'pdf' || rawFileData.file_type === 'csv') {
            // Process as statement if account_id is provided
            if (rawFileData.account_id) {
                const extractedData = await (0, gemini_1.extractStatementData)(fileContent, rawFileData.file_type, apiKey);
                // Create statement document
                const statementData = {
                    account_id: rawFileData.account_id,
                    raw_file_id: fileId,
                    period_start: firestore_2.Timestamp.fromDate(new Date(extractedData.period_start)),
                    period_end: firestore_2.Timestamp.fromDate(new Date(extractedData.period_end)),
                    opening_balance: extractedData.opening_balance,
                    closing_balance: extractedData.closing_balance,
                    is_validated: false,
                    validation_errors: [],
                    metadata: {
                        created_at: firestore_2.Timestamp.now(),
                        updated_at: firestore_2.Timestamp.now(),
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
                        date: firestore_2.Timestamp.fromDate(new Date(transaction.date)),
                        amount: transaction.amount,
                        description: transaction.description,
                        merchant: transaction.merchant || null,
                        category_id: null,
                        receipt_id: null,
                        is_reconciled: false,
                        metadata: {
                            created_at: firestore_2.Timestamp.now(),
                            updated_at: firestore_2.Timestamp.now(),
                        },
                    });
                }
                await batch.commit();
            }
        }
        else if (rawFileData.file_type === 'image') {
            // Process as receipt
            const extractedData = await (0, gemini_1.extractReceiptData)(fileContent, rawFileData.file_type, apiKey);
            // Create receipt document
            const receiptData = {
                raw_file_id: fileId,
                transaction_id: null,
                date: firestore_2.Timestamp.fromDate(new Date(extractedData.date)),
                merchant: extractedData.merchant,
                total_amount: extractedData.total_amount,
                tax_amount: extractedData.tax_amount || 0,
                items: [],
                storage_path: rawFileData.storage_path,
                metadata: {
                    created_at: firestore_2.Timestamp.now(),
                    updated_at: firestore_2.Timestamp.now(),
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
                        created_at: firestore_2.Timestamp.now(),
                        updated_at: firestore_2.Timestamp.now(),
                    },
                });
            }
            await batch.commit();
        }
        // Update status to completed
        await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
            status: 'completed',
            updated_at: firestore_2.Timestamp.now(),
        });
    }
    catch (error) {
        // Update status to failed
        await db.collection('users').doc(userId).collection('rawFiles').doc(fileId).update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: firestore_2.Timestamp.now(),
        });
        throw error;
    }
}
//# sourceMappingURL=processFile.js.map
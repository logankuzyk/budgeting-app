import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { seedDefaultCategories } from './seedDefaultCategories';
import { processFile } from './processFile';

admin.initializeApp();

// Trigger on user creation to seed default categories
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    await seedDefaultCategories(user.uid);
    console.log(`Default categories seeded for user: ${user.uid}`);
  } catch (error) {
    console.error(`Error seeding categories for user ${user.uid}:`, error);
  }
});

// Trigger on rawFiles document creation to process files
export const onRawFileCreate = functions.firestore
  .document('users/{userId}/rawFiles/{fileId}')
  .onCreate(async (snap, context) => {
    const rawFileData = snap.data();
    const userId = context.params.userId;
    const fileId = context.params.fileId;
    
    // Type assertion for RawFileData
    const rawFile = rawFileData as {
      filename: string;
      file_type: 'pdf' | 'csv' | 'image' | 'email';
      storage_path: string;
      account_id?: string | null;
      status: 'pending' | 'processing' | 'completed' | 'failed';
    };
    
    try {
      await processFile(userId, fileId, rawFile);
    } catch (error) {
      console.error(`Error processing file ${fileId} for user ${userId}:`, error);
      // Update rawFile status to failed
      await snap.ref.update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

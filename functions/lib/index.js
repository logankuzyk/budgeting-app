"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRawFileCreate = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const seedDefaultCategories_1 = require("./seedDefaultCategories");
const processFile_1 = require("./processFile");
admin.initializeApp();
// Trigger on user creation to seed default categories
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        await (0, seedDefaultCategories_1.seedDefaultCategories)(user.uid);
        console.log(`Default categories seeded for user: ${user.uid}`);
    }
    catch (error) {
        console.error(`Error seeding categories for user ${user.uid}:`, error);
    }
});
// Trigger on rawFiles document creation to process files
exports.onRawFileCreate = functions.firestore
    .document('users/{userId}/rawFiles/{fileId}')
    .onCreate(async (snap, context) => {
    const rawFileData = snap.data();
    const userId = context.params.userId;
    const fileId = context.params.fileId;
    // Type assertion for RawFileData
    const rawFile = rawFileData;
    try {
        await (0, processFile_1.processFile)(userId, fileId, rawFile);
    }
    catch (error) {
        console.error(`Error processing file ${fileId} for user ${userId}:`, error);
        // Update rawFile status to failed
        await snap.ref.update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=index.js.map
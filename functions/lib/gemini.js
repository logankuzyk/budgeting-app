"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStatementData = extractStatementData;
exports.extractReceiptData = extractReceiptData;
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const zod_1 = require("zod");
// Statement extraction schema
const StatementSchema = zod_1.z.object({
    account_name: zod_1.z.string().optional(),
    period_start: zod_1.z.string(),
    period_end: zod_1.z.string(),
    opening_balance: zod_1.z.number(),
    closing_balance: zod_1.z.number(),
    transactions: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        amount: zod_1.z.number(),
        description: zod_1.z.string(),
        merchant: zod_1.z.string().optional(),
    })),
});
// Receipt extraction schema
const ReceiptSchema = zod_1.z.object({
    date: zod_1.z.string(),
    merchant: zod_1.z.string(),
    total_amount: zod_1.z.number(),
    tax_amount: zod_1.z.number().optional(),
    items: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string(),
        quantity: zod_1.z.number().optional(),
        unit_price: zod_1.z.number().optional(),
        total_price: zod_1.z.number(),
    })),
});
async function extractStatementData(fileContent, fileType, apiKey) {
    // Set API key via environment variable for @ai-sdk/google
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    const model = (0, google_1.google)('gemini-2.0-flash-exp');
    const prompt = `Extract financial statement data from the following ${fileType} content. 
Return structured data including account name, statement period (start and end dates), opening balance, closing balance, and all transactions with dates, amounts, descriptions, and merchants.

File content:
${fileContent.substring(0, 50000)}`; // Limit content size
    const result = await (0, ai_1.generateObject)({
        model,
        schema: StatementSchema,
        prompt,
    });
    return result.object;
}
async function extractReceiptData(fileContent, fileType, apiKey) {
    // Set API key via environment variable for @ai-sdk/google
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    const model = (0, google_1.google)('gemini-2.0-flash-exp');
    const prompt = `Extract receipt data from the following ${fileType} content.
Return structured data including date, merchant name, total amount, tax amount, and all items with descriptions, quantities, unit prices, and total prices.

File content:
${fileContent.substring(0, 50000)}`; // Limit content size
    const result = await (0, ai_1.generateObject)({
        model,
        schema: ReceiptSchema,
        prompt,
    });
    return result.object;
}
//# sourceMappingURL=gemini.js.map
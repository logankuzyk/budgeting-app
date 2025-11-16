import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Statement extraction schema
const StatementSchema = z.object({
  account_name: z.string().optional(),
  period_start: z.string(),
  period_end: z.string(),
  opening_balance: z.number(),
  closing_balance: z.number(),
  transactions: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    description: z.string(),
    merchant: z.string().optional(),
  })),
});

// Receipt extraction schema
const ReceiptSchema = z.object({
  date: z.string(),
  merchant: z.string(),
  total_amount: z.number(),
  tax_amount: z.number().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    total_price: z.number(),
  })),
});

export interface ExtractedStatement {
  account_name?: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  transactions: Array<{
    date: string;
    amount: number;
    description: string;
    merchant?: string;
  }>;
}

export interface ExtractedReceipt {
  date: string;
  merchant: string;
  total_amount: number;
  tax_amount?: number;
  items: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total_price: number;
  }>;
}

export async function extractStatementData(
  fileContent: string,
  fileType: 'pdf' | 'csv' | 'image' | 'email',
  apiKey: string
): Promise<ExtractedStatement> {
  // Set API key via environment variable for @ai-sdk/google
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  const model = google('gemini-2.0-flash-exp');

  const prompt = `Extract financial statement data from the following ${fileType} content. 
Return structured data including account name, statement period (start and end dates), opening balance, closing balance, and all transactions with dates, amounts, descriptions, and merchants.

File content:
${fileContent.substring(0, 50000)}`; // Limit content size

  const result = await generateObject({
    model,
    schema: StatementSchema,
    prompt,
  });

  return result.object as ExtractedStatement;
}

export async function extractReceiptData(
  fileContent: string,
  fileType: 'pdf' | 'csv' | 'image' | 'email',
  apiKey: string
): Promise<ExtractedReceipt> {
  // Set API key via environment variable for @ai-sdk/google
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
  const model = google('gemini-2.0-flash-exp');

  const prompt = `Extract receipt data from the following ${fileType} content.
Return structured data including date, merchant name, total amount, tax amount, and all items with descriptions, quantities, unit prices, and total prices.

File content:
${fileContent.substring(0, 50000)}`; // Limit content size

  const result = await generateObject({
    model,
    schema: ReceiptSchema,
    prompt,
  });

  return result.object as ExtractedReceipt;
}

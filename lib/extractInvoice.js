import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const anthropic = new Anthropic();

export const SUPPORTED_MEDIA_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const InvoiceSchema = z.object({
  vendorName: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  invoiceDate: z.string().nullable().describe('ISO 8601 date (YYYY-MM-DD)'),
  currency: z.string().nullable().describe('ISO 4217 currency code, e.g. USD, GBP'),
  total: z.number().nullable(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unitPrice: z.number().nullable(),
      amount: z.number().nullable(),
    })
  ),
});

export async function extractInvoice({ base64, mediaType }) {
  const documentBlock =
    mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };

  const response = await anthropic.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          documentBlock,
          {
            type: 'text',
            text: 'Extract the invoice details from this document. Use null for any field you cannot find.',
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(InvoiceSchema) },
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The document could not be processed (declined by content safety checks).');
  }

  if (!response.parsed_output) {
    throw new Error('Could not parse a structured result from the model response.');
  }

  return response.parsed_output;
}

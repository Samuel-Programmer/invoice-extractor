import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractInvoice, SUPPORTED_MEDIA_TYPES } from '@/lib/extractInvoice';
import { serializeExtraction } from '@/lib/serializeExtraction';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (!SUPPORTED_MEDIA_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Upload a PDF, PNG, JPEG, or WebP.` },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  let extracted;
  try {
    extracted = await extractInvoice({ base64, mediaType: file.type });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Extraction failed.' }, { status: 502 });
  }

  const record = await prisma.extraction.create({
    data: {
      fileName: file.name,
      vendorName: extracted.vendorName,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.invoiceDate ? new Date(extracted.invoiceDate) : null,
      currency: extracted.currency,
      total: extracted.total,
      lineItems: extracted.lineItems,
    },
  });

  return NextResponse.json(serializeExtraction(record));
}

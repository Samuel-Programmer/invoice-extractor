import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeExtraction } from '@/lib/serializeExtraction';

export async function GET() {
  const extractions = await prisma.extraction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json(extractions.map(serializeExtraction));
}

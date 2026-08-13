import { prisma } from '@/lib/prisma';
import { serializeExtraction } from '@/lib/serializeExtraction';
import UploadForm from './components/UploadForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const extractions = await prisma.extraction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="page">
      <header>
        <h1>Invoice Data Extractor</h1>
        <p className="subtitle">
          Upload a PDF or image invoice and get structured line-item data back, powered by Claude.
        </p>
      </header>
      <UploadForm initialExtractions={extractions.map(serializeExtraction)} />
    </div>
  );
}

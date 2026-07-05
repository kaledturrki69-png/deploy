import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Product } from '@/constants/data';
import ProductForm from './product-form';

type TProductViewPageProps = {
  productId: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product: Product | null = null;
  let pageTitle = 'Upload New CV';

  if (productId !== 'new') {
    try {
      const session = await getServerSession(authOptions);
      const token = (session as any)?.accessToken;

      const res = await fetch(
        `${API_BASE}/api/v1/documents/documents/${productId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }
      );

      if (!res.ok) notFound();

      const doc = await res.json();
      product = {
        id: doc.id,
        name: doc.filename ?? 'Unknown',
        description: `Uploaded by ${doc.uploaded_by ?? '—'}`,
        created_at: doc.uploaded_at ?? '',
        updated_at: doc.uploaded_at ?? '',
        price: 0,
        photo_url: '',
        category: doc.doc_type ?? 'other',
        type: doc.mime_type?.includes('pdf') ? 'pdf' : 'word',
        source: doc.source ?? 'upload',
        filename: doc.filename ?? '',
        date: doc.uploaded_at ? doc.uploaded_at.slice(0, 10) : '',
        size: doc.size ? `${Math.round(doc.size / 1024)}K` : '—',
        analyse: doc.processing_status === 'success'
          ? '100%'
          : doc.processing_status === 'error'
            ? 'error'
            : '—'
      };

      pageTitle = `Document: ${doc.filename}`;
    } catch {
      notFound();
    }
  }

  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}

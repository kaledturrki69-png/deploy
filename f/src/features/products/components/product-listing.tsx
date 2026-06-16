import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchParamsCache } from '@/lib/searchparams';
import { ProductTable } from './product-tables';
import { columns } from './product-tables/columns';
import { Product } from '@/constants/data';

type ProductListingPage = {};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default async function ProductListingPage({}: ProductListingPage) {
  const page = searchParamsCache.get('page') ?? 1;
  const search =
    searchParamsCache.get('name') || searchParamsCache.get('filename') || '';
  const pageLimit = searchParamsCache.get('perPage') ?? 10;

  let products: Product[] = [];
  let totalProducts = 0;

  try {
    const session = await getServerSession(authOptions);
    const token = (session as any)?.accessToken;

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageLimit),
      ...(search ? { search } : {})
    });

    const res = await fetch(
      `${API_BASE}/api/v1/documents/?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results ?? [];
      totalProducts = data.count ?? results.length;

      // Map Django Document fields → Product shape used by the table
      products = results.map((doc: any): Product => ({
        id: doc.id,
        name: doc.filename ?? 'Unknown',
        description: `Uploaded by ${doc.uploaded_by ?? '—'}`,
        created_at: doc.uploaded_at ?? '',
        updated_at: doc.updated_at ?? doc.uploaded_at ?? '',
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
            : doc.processing_status === 'pending'
              ? '50%'
              : '—'
      }));
    }
  } catch (err) {
    // Silently degrade — table renders empty
  }

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}

import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { PageWrapper } from './page-wrapper';

export const metadata = {
  title: 'Upload CV | getajob',
  description: 'Upload and manage CV documents'
};

type pageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const locale = params.locale;

  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <PageWrapper locale={locale} />
    </PageContainer>
  );
}

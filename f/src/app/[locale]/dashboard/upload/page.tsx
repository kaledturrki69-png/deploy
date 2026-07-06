'use client';

import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ServerStatus } from '@/features/documents/components/server-status';
import { UploadSection } from '@/features/documents/components/upload-section';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('uploads_page');

  const handleBack = () => {
    router.push(`/${locale}/dashboard/upload-cv`);
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-4'>
            <h2 className='text-3xl font-bold tracking-tight'>{t('title')}</h2>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBack}
              className='flex-shrink-0'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <Separator />
        <ServerStatus />
        <UploadSection />
      </div>
    </PageContainer>
  );
}

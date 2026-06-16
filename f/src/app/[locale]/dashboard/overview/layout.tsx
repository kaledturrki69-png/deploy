'use client';

import PageContainer from '@/components/layout/page-container';
import { CandidatesTrendCard } from '@/features/overview/components/candidates-trend';
import { GetajobCandidatesTrendCard } from '@/features/overview/components/getajob-candidates-trend';
import { PositionsMatchingCard } from '@/features/overview/components/matching-position';
import { ActiveCandidatesCard } from '@/features/overview/components/active-users';
import React from 'react';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/use-page-title';

export default function OverViewLayout({
  sales,
  //pie_stats,
  bar_stats
  //area_stats
}: {
  sales: React.ReactNode;
  //pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  //area_stats: React.ReactNode;
}) {
  const t = useTranslations('dashboard');
  usePageTitle('Dashboard');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>{t('welcome')}</h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <CandidatesTrendCard />
          <GetajobCandidatesTrendCard />
          <PositionsMatchingCard />
          <ActiveCandidatesCard />
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          {/* <div className='col-span-4'>{area_stats}</div> */}
          {/* <div className='col-span-4 md:col-span-3'>{pie_stats}</div> */}
        </div>
      </div>
    </PageContainer>
  );
}

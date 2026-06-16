'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardDescription,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconUsersGroup } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchingStats {
  total_positions: number;
  company_matches: number;
  getajob_matches: number;
}

export function PositionsMatchingCard() {
  const [data, setData] = useState<MatchingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/positions-matching');
        if (!res.ok) throw new Error('Failed to fetch');
        const d = await res.json();
        setData(d);
      } catch (err) {
        // Error silently ignored - component shows loading state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Active Positions</CardDescription>
          <Skeleton className='h-8 w-[100px]' />
        </CardHeader>
        <CardFooter className='flex flex-col items-start gap-1.5 text-sm'>
          <Skeleton className='h-4 w-[180px]' />
          <Skeleton className='h-4 w-[180px]' />
        </CardFooter>
      </Card>
    );
  }

  if (!data) return null;

  const { total_positions, company_matches, getajob_matches } = data;
  const total_matches = company_matches + getajob_matches;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Active positions</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {total_positions}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <IconUsersGroup className='mr-1 size-4' />
            {total_matches} matches
          </Badge>
        </CardAction>
      </CardHeader>

      <CardFooter className='flex flex-col items-start gap-1.5 text-sm'>
        <div className='flex gap-2 font-medium text-blue-700'>
          Company candidates:{' '}
          <span className='font-semibold'>{company_matches}</span>
        </div>
        <div className='flex gap-2 font-medium text-indigo-600'>
          getajob candidates:{' '}
          <span className='font-semibold'>{getajob_matches}</span>
        </div>
        <div className='text-muted-foreground'>
          Matching profiles across active positions
        </div>
      </CardFooter>
    </Card>
  );
}

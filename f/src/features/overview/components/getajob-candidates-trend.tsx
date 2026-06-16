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
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TrendData {
  current_week: number;
  previous_week: number;
  percent_change: number;
  trend: 'up' | 'down';
}

export function GetajobCandidatesTrendCard() {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/getajob-candidates-trend');
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
          <CardDescription>getajob Candidates</CardDescription>
          <Skeleton className='h-8 w-[120px]' />
        </CardHeader>
        <CardFooter className='text-muted-foreground text-sm'>
          <Skeleton className='h-4 w-[160px]' />
        </CardFooter>
      </Card>
    );
  }

  if (!data) return null;

  const { current_week, percent_change, trend } = data;
  const TrendIcon = trend === 'up' ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>getajob platform candidates this week</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {current_week}
        </CardTitle>
        <CardAction>
          <Badge
            variant='outline'
            className={cn(
              trend === 'up'
                ? 'border-green-300 text-green-600'
                : 'border-red-300 text-red-600'
            )}
          >
            <TrendIcon className='mr-1 size-4' />
            {percent_change > 0 ? '+' : ''}
            {percent_change.toFixed(1)}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='flex gap-2 font-medium'>
          {trend === 'up' ? 'Trending up' : 'Trending down'} this week
          <TrendIcon className='size-4' />
        </div>
        <div className='text-muted-foreground'>
          Candidates created on the getajob platform
        </div>
      </CardFooter>
    </Card>
  );
}

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
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUserCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ActiveStats {
  active_week: number;
  previous_week: number;
  total_users: number;
  trend: 'up' | 'down';
  percent_change: number;
}

export function ActiveCandidatesCard() {
  const [data, setData] = useState<ActiveStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/active-candidates')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {
        // Fallback to zeros on error
        setData({ active_week: 0, previous_week: 0, total_users: 0, trend: 'up', percent_change: 0 });
      });
  }, []);

  if (!data) {
    return (
      <Card className='@container/card animate-pulse'>
        <CardHeader>
          <CardDescription>Active Candidates (Apps)</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums'>—</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { active_week, percent_change, trend, total_users } = data;
  const TrendIcon = trend === 'up' ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>Active Candidates (Apps)</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {active_week}
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
          {trend === 'up'
            ? 'More active users this week'
            : 'Less active users this week'}
          <TrendIcon className='size-4' />
        </div>
        <div className='text-muted-foreground flex items-center gap-2'>
          <IconUserCheck className='text-muted-foreground size-4' />
          Total registered users:{' '}
          <span className='font-semibold'>{total_users}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

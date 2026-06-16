'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className,
  children
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
          <Image
            src='/assets/logo.png'
            alt='getajob Logo'
            width={32}
            height={32}
            className='h-8 w-8'
          />
        </div>
        <div className='flex-1'>
          <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>
          {description && (
            <p className='text-muted-foreground mt-1'>{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

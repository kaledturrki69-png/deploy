'use client';

import { useEffect } from 'react';

/**
 * Hook to set the page title dynamically for client components
 * @param title - The title to set (will be appended with " | getajob")
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title.includes('|') ? title : `${title} | getajob`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

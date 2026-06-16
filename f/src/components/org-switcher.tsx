'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { IconBuilding, IconSelector, IconCheck } from '@tabler/icons-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import Image from 'next/image';

interface Workplace {
  id: number;
  name: string;
}

export function OrgSwitcher() {
  const { data: session } = useSession();
  const [workplaces, setWorkplaces] = React.useState<Workplace[]>([]);
  const [activeWorkplace, setActiveWorkplace] = React.useState<Workplace | null>(null);

  // Decode JWT to get the company name
  const companyName = React.useMemo(() => {
    try {
      const token: string | undefined = (session as any)?.accessToken;
      if (!token) return undefined;
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '==='.slice((base64.length + 3) % 4);
      const payload = JSON.parse(atob(padded));
      return payload?.company?.name as string | undefined;
    } catch {
      return undefined;
    }
  }, [session]);

  // Fetch workplaces from the real API
  React.useEffect(() => {
    async function loadWorkplaces() {
      try {
        const res = await fetch('/api/accounts/workplaces');
        if (!res.ok) return;
        const data = await res.json();
        const list: Workplace[] = Array.isArray(data) ? data : data.results ?? [];
        setWorkplaces(list);
        if (list.length > 0 && !activeWorkplace) {
          // Restore from localStorage if saved
          const saved = localStorage.getItem('activeWorkplaceId');
          const found = saved ? list.find((w) => String(w.id) === saved) : null;
          setActiveWorkplace(found ?? list[0]);
        }
      } catch {
        // Silently degrade — no workplaces shown
      }
    }
    if (session) loadWorkplaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSwitch = (workplace: Workplace) => {
    setActiveWorkplace(workplace);
    localStorage.setItem('activeWorkplaceId', String(workplace.id));
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent'>
                <Image
                  src='/assets/logo.png'
                  alt='Logo'
                  width={20}
                  height={20}
                  className='size-10'
                />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold'>getajob</span>
                <span className='text-xs opacity-70'>
                  {activeWorkplace?.name ?? companyName ?? '—'}
                </span>
              </div>
              {workplaces.length > 1 && (
                <IconSelector className='ml-auto size-4 opacity-50' />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {workplaces.length > 1 && (
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
              align='start'
              side='bottom'
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Workplaces
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workplaces.map((workplace) => (
                <DropdownMenuItem
                  key={workplace.id}
                  onSelect={() => handleSwitch(workplace)}
                  className='gap-2 p-2'
                >
                  <IconBuilding className='size-4 shrink-0' />
                  {workplace.name}
                  {activeWorkplace?.id === workplace.id && (
                    <IconCheck className='ml-auto size-4' />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

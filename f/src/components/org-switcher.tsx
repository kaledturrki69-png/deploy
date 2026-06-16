'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import Image from 'next/image';

interface Tenant {
  id: string;
  name: string;
}

export function OrgSwitcher({
  tenants,
  defaultTenant
}: {
  tenants: Tenant[];
  defaultTenant: Tenant;
  onTenantSwitch?: (tenantId: string) => void;
}) {
  const { data: session } = useSession();
  const [selectedTenant] = React.useState<Tenant | undefined>(
    defaultTenant || (tenants.length > 0 ? tenants[0] : undefined)
  );

  // Decode JWT and get company name
  const companyName = React.useMemo(() => {
    try {
      const token: string | undefined = (session as any)?.accessToken;
      if (!token) return undefined;
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      // Base64URL decode
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '==='.slice((base64.length + 3) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);
      return payload?.company?.name as string | undefined;
    } catch {
      return undefined;
    }
  }, [session]);

  if (!selectedTenant) {
    return null;
  }
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
                <span className=''>{companyName || selectedTenant.name}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {/* Dropdown list removed per requirement */}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

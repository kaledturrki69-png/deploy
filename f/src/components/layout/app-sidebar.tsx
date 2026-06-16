'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';

import {
  IconChevronRight,
  IconChevronsDown,
  IconHelp,
  IconFileText
} from '@tabler/icons-react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { useNavItems } from '@/i18n/components/nav-items'; // ✅ use translated nav items

/* -------------------------------------------------------------------------- */
/*                              Company / Tenants                             */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
/*                                 Sidebar                                    */
/* -------------------------------------------------------------------------- */

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';
  const t = useTranslations('dashboard'); // ✅ namespace for sidebar UI text
  const navItems = useNavItems(); // ✅ localized navigation items

  const [, setProfile] = useState<{
    name?: string;
    email?: string;
    imageBase64?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'profile') {
        try {
          setProfile(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>

      {/* -------------------------- Sidebar Main --------------------------- */}
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{t('overview')}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const hasChildren = item.items && item.items.length > 0;

              if (hasChildren) {
                return (
                  <Collapsible
                    key={item.url + item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname === item.url}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={{ pathname: subItem.url }}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={{ pathname: item.url }}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* --------------------------- Footer menu ---------------------------- */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                    <IconFileText className='text-primary-foreground h-4 w-4' />
                  </div>
                  <div className='flex flex-col gap-0.5 leading-none'>
                    <span className='font-semibold'>{t('about')}</span>
                    <span className='text-muted-foreground text-xs'>
                      getajob
                    </span>
                  </div>
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    <div className='flex items-center space-x-2'>
                      <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                        <IconFileText className='text-primary-foreground h-4 w-4' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {t('about')}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          getajob
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push(`/${locale}/dashboard/help`)}
                  >
                    <IconHelp className='mr-2 h-4 w-4' />
                    {t('help')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/${locale}/dashboard/releases`)}
                  >
                    <IconFileText className='mr-2 h-4 w-4' />
                    {t('releases')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

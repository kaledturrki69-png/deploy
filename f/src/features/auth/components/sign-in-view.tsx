import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import UserAuthForm from './user-auth-form';
// import { GitHubLogoIcon } from '@radix-ui/react-icons';
// import { IconStar } from '@tabler/icons-react';
import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Link as I18nLink } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignInViewPage() {
  const t = useTranslations('auth');
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='absolute top-4 left-4 hidden gap-2 md:flex'>
        <I18nLink
          href={{ pathname: '/auth/sign-in' }}
          locale='en'
          className='hover:bg-white-200 flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-black transition'
        >
          EN
        </I18nLink>
        <I18nLink
          href={{ pathname: '/auth/sign-in' }}
          locale='fr'
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-black transition hover:bg-gray-200'
        >
          FR
        </I18nLink>
      </div>

      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        {t('signIn')}
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-black lg:flex dark:border-r'>
        <div className='bg-white-900 absolute inset-0' />
        <div className='relative z-20 flex h-full flex-col items-center justify-center'>
          <Image
            src='/assets/logo.png'
            alt='Logo'
            width={200}
            height={200}
            className='mb-4'
          />
          getajob, a new way of hiring, an new way for finding your next job!
        </div>
        {/* <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;This starter template has saved me countless hours of work
              and helped me deliver projects to my clients faster than ever
              before.&rdquo;
            </p>
            <footer className='text-sm'>Random Dude</footer>
          </blockquote>
        </div> */}
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <UserAuthForm />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            {t('termsCaption')}{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              {t('terms')}
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              {t('privacy')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

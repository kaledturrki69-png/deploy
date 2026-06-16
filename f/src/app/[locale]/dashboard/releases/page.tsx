import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Image from 'next/image';

export const metadata = {
  title: 'Dashboard: Releases'
};

export default function ReleasesPage() {
  const releases = [
    {
      version: 'v1.0.0',
      date: '2025-11-04',
      type: 'major',
      title: 'Document Management & Authentication Overhaul',
      changes: [
        {
          category: '🔐 Authentication',
          items: [
            'Implemented NextAuth.js with JWT token management',
            'Added automatic token refresh mechanism',
            'Integrated Django backend authentication',
            'Removed hardcoded API tokens for security'
          ]
        },
        {
          category: '📄 Document Management',
          items: [
            'Created comprehensive document upload system',
            'Implemented PDF and Word document preview',
            'Added client-side pagination for better performance',
            'Built file download and delete functionality',
            'Integrated with Django API endpoints'
          ]
        },
        {
          category: '🎨 UI/UX Improvements',
          items: [
            'Updated sidebar navigation with company name from JWT',
            'Replaced user menu with About section',
            'Added Help and Releases pages',
            'Improved responsive design',
            'Enhanced error handling and loading states'
          ]
        },
        {
          category: '🔧 Technical Improvements',
          items: [
            'Fixed all ESLint warnings and TypeScript errors',
            'Optimized build process and removed unused dependencies',
            'Implemented proper error boundaries',
            'Added comprehensive logging for debugging',
            'Improved API route structure and error handling'
          ]
        }
      ]
    },
    {
      version: 'v1.1.0',
      date: '2025-01-22',
      type: 'minor',
      title: 'API Integration & File Handling',
      changes: [
        {
          category: '🌐 API Integration',
          items: [
            'Connected frontend to Django backend API',
            'Implemented document listing and filtering',
            'Added search functionality across documents',
            'Created API proxy routes for security'
          ]
        },
        {
          category: '📁 File Operations',
          items: [
            'Added file upload with progress tracking',
            'Implemented file preview for PDFs and Word docs',
            'Created download functionality',
            'Added file deletion with confirmation'
          ]
        }
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-01-21',
      type: 'major',
      title: 'Initial Release',
      changes: [
        {
          category: '🚀 Project Setup',
          items: [
            'Initialized Next.js project with TypeScript',
            'Set up Tailwind CSS and shadcn/ui components',
            'Configured internationalization with next-intl',
            'Implemented basic dashboard structure'
          ]
        },
        {
          category: '🎯 Core Features',
          items: [
            'Created responsive sidebar navigation',
            'Implemented authentication system',
            'Added dashboard overview page',
            'Set up routing and layout components'
          ]
        }
      ]
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 🔽 Deployment info from environment variables
  const deployInfo = {
    commit: process.env.DEPLOY_COMMIT,
    date: process.env.DEPLOY_DATE,
    author: process.env.DEPLOY_AUTHOR,
    branch: process.env.DEPLOY_BRANCH,
    message: process.env.DEPLOY_MESSAGE
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='bg-primary flex h-12 w-12 items-center justify-center rounded-lg'>
              <Image
                src='/assets/logo.png'
                alt='getajob Logo'
                width={24}
                height={24}
                className='text-primary-foreground'
              />
            </div>
            <div>
              <Heading
                title='getajob Releases'
                description='Track all changes and improvements made to the platform'
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Releases List */}
        <div className='space-y-6'>
          {releases.map((release, index) => (
            <Card key={index} className='w-full'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <CardTitle className='text-xl'>{release.title}</CardTitle>
                    <Badge className={`${getTypeColor(release.type)} border`}>
                      {release.version}
                    </Badge>
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {new Date(release.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <CardDescription>
                  Released on {release.date} • {release.type} release
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {release.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className='space-y-2'>
                      <h4 className='text-foreground text-sm font-medium'>
                        {change.category}
                      </h4>
                      <ul className='ml-4 space-y-1'>
                        {change.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className='text-muted-foreground flex items-start text-sm'
                          >
                            <span className='mr-2'>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className='bg-muted/50 text-muted-foreground mt-8 rounded-lg p-4 text-sm'>
          <div className='mb-1 flex items-center space-x-2'>
            <Image
              src='/assets/logo.png'
              alt='getajob Logo'
              width={16}
              height={16}
            />
            <span>getajob Platform</span>
          </div>

          {/* 🧾 Deploy info */}
          {deployInfo.commit && (
            <div className='mt-1 ml-6 space-y-0.5'>
              <p>
                Commit: <code>{deployInfo.commit}</code>
              </p>
              <p>Branch: {deployInfo.branch}</p>
              <p>Author: {deployInfo.author}</p>
              <p>Date: {new Date(deployInfo.date ?? '').toLocaleString()}</p>
              <p>Message: {deployInfo.message}</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

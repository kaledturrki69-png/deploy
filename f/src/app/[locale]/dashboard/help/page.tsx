'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  IconExternalLink,
  IconMail,
  IconPhone,
  IconQuestionMark
} from '@tabler/icons-react';

export default function HelpPage() {
  const helpSections = [
    {
      title: 'Getting Started',
      description: 'Learn how to use getajob platform effectively',
      items: [
        {
          question: 'How do I upload my CV?',
          answer:
            'Click the "Upload" button in the top-right corner of the Upload CV page. Select your PDF or Word document and it will be processed automatically.'
        },
        {
          question: 'How do I view my uploaded documents?',
          answer:
            'All your uploaded documents appear in the table on the Upload CV page. You can search, filter, and paginate through them.'
        },
        {
          question: 'Can I preview documents without downloading?',
          answer:
            'Yes! Click the "View" button in the actions menu for any PDF or Word document to preview it directly in the browser.'
        }
      ]
    },
    {
      title: 'Document Management',
      description: 'Everything about managing your documents',
      items: [
        {
          question: 'What file formats are supported?',
          answer:
            'We support PDF and Microsoft Word documents (.pdf, .doc, .docx). Images and other formats may be supported in future updates.'
        },
        {
          question: 'How do I delete a document?',
          answer:
            'Click the three-dot menu next to any document and select "Delete". You\'ll be asked to confirm before the document is permanently removed.'
        },
        {
          question: 'Is there a file size limit?',
          answer:
            "Currently, there's no strict file size limit, but we recommend keeping files under 10MB for optimal performance."
        }
      ]
    },
    {
      title: 'Account & Security',
      description: 'Managing your account and security settings',
      items: [
        {
          question: 'How do I change my password?',
          answer:
            'Password changes are handled through your account settings. Contact your administrator if you need assistance.'
        },
        {
          question: 'Why do I get logged out automatically?',
          answer:
            'For security, your session expires after a period of inactivity. Simply log in again to continue using the platform.'
        },
        {
          question: 'Is my data secure?',
          answer:
            'Yes! All data is encrypted in transit and at rest. We use industry-standard security practices to protect your information.'
        }
      ]
    }
  ];

  const contactInfo = [
    {
      icon: IconMail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@getajob.com',
      action: 'mailto:support@getajob.com'
    },
    {
      icon: IconPhone,
      title: 'Phone Support',
      description: 'Call us directly',
      contact: '+216 00 000 000',
      action: 'tel:+216 00 000 000'
    },
    {
      icon: IconQuestionMark,
      title: 'FAQ',
      description: 'Frequently asked questions',
      contact: 'View FAQ',
      action: '#faq'
    }
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Image
              src='/assets/logo.png'
              alt='Logo'
              width={20}
              height={20}
              className='size-10'
            />
            <div>
              <Heading
                title='Help Center'
                description='Find answers to common questions and get support'
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {contactInfo.map((contact, index) => (
            <Card key={index} className='transition-shadow hover:shadow-md'>
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                    <contact.icon className='text-primary h-5 w-5' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>{contact.title}</CardTitle>
                    <CardDescription>{contact.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => window.open(contact.action)}
                >
                  {contact.contact}
                  <IconExternalLink className='ml-2 h-4 w-4' />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Sections */}
        <div className='space-y-6'>
          {helpSections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <span>{section.title}</span>
                  <Badge variant='secondary'>
                    {section.items.length} topics
                  </Badge>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className='border-primary/20 border-l-2 pl-4'
                    >
                      <h4 className='text-foreground mb-1 text-sm font-medium'>
                        {item.question}
                      </h4>
                      <p className='text-muted-foreground text-sm'>
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className='bg-muted/50 mt-8 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
              <Image
                src='/assets/logo.png'
                alt='getajob Logo'
                width={16}
                height={16}
              />
              <span>Need more help? Contact our support team</span>
            </div>
            <Button variant='outline' size='sm'>
              <IconMail className='mr-2 h-4 w-4' />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

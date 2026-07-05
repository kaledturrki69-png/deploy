'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Document } from '@/types/document';
import { DocumentService } from '@/services/documentService';
import { CellAction } from '@/features/documents/components/document-tables/cell-action';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import ReactTimeAgo from 'react-time-ago';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
// Import to ensure TimeAgo locales are initialized
import '@/lib/time-ago';

export const candidatesColumns: ColumnDef<Document>[] = [
  {
    accessorKey: 'filename',
    header: 'Name',
    size: 250,
    cell: ({ row }) => {
      const filename = row.getValue('filename') as string;
      const candidate = row.original.candidate;
      const docType = String(row.original.doc_type || '').toLowerCase();

      // Get candidate name or truncated filename
      let displayName = '';
      if (
        candidate &&
        typeof candidate === 'object' &&
        candidate.first_name &&
        candidate.last_name
      ) {
        displayName = `${candidate.first_name} ${candidate.last_name}`;
      } else {
        // Truncate filename to 20 characters max
        displayName =
          filename && filename.length > 20
            ? filename.substring(0, 20) + '...'
            : filename || 'Unknown';
      }

      // Get file type icon
      const getFileIcon = () => {
        if (docType.includes('pdf')) {
          return '/assets/pdf.svg';
        } else if (docType.includes('word') || docType.includes('doc')) {
          return '/assets/word.svg';
        }
        return '/assets/pdf.svg';
      };

      return (
        <div className='flex items-center space-x-3'>
          <Image
            src={getFileIcon()}
            alt={docType}
            width={20}
            height={20}
            className='h-5 w-5 flex-shrink-0'
          />
          <div className='min-w-0 font-medium'>
            <div className='truncate'>{displayName}</div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'size',
    header: 'Size',
    size: 100,
    cell: ({ row }) => {
      const size = row.getValue('size') as number;
      return (
        <div className='text-muted-foreground text-sm whitespace-nowrap'>
          {DocumentService.formatFileSize(size)}
        </div>
      );
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 120,
    cell: ({ row }) => {
      const source = String(row.getValue('source') || 'upload');

      const getSourceLabel = (source: string) => {
        switch (source.toLowerCase()) {
          case 'web':
          case 'web_app':
            return 'Web App';
          case 'mobile':
          case 'mobile_app':
            return 'Mobile App';
          case 'phone':
          case 'phone_app':
            return 'Phone App';
          default:
            return 'Web App';
        }
      };

      return (
        <span className='text-sm font-medium'>{getSourceLabel(source)}</span>
      );
    }
  },
  {
    accessorKey: 'processing_status',
    header: 'Status',
    size: 80,
    cell: ({ row }) => {
      const status = String(row.getValue('processing_status') || 'pending');

      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'completed':
          case 'success':
            return <CheckCircle className='h-5 w-5 text-green-600' />;
          case 'processing':
            return <Loader2 className='h-5 w-5 animate-spin text-blue-600' />;
          case 'pending':
            return <Clock className='h-5 w-5 text-yellow-600' />;
          case 'failed':
          case 'error':
            return <XCircle className='h-5 w-5 text-red-600' />;
          default:
            return <Clock className='h-5 w-5 text-gray-600' />;
        }
      };

      const getStatusLabel = (status: string) => {
        switch (status) {
          case 'completed':
          case 'success':
            return 'Completed';
          case 'processing':
            return 'Processing';
          case 'pending':
            return 'Pending';
          case 'failed':
          case 'error':
            return 'Failed';
          default:
            return status;
        }
      };

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex cursor-help items-center'>
                {getStatusIcon(status)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className='capitalize'>{getStatusLabel(status)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  },
  {
    accessorKey: 'uploaded_at',
    header: 'Uploaded',
    size: 120,
    cell: ({ row }) => {
      const uploadedAt = row.getValue('uploaded_at');
      const date = uploadedAt ? new Date(uploadedAt as string) : new Date();

      if (isNaN(date.getTime())) {
        return <div className='text-muted-foreground text-sm'>Invalid date</div>;
      }

      return (
        <div className='text-muted-foreground text-sm whitespace-nowrap'>
          <ReactTimeAgo date={date} locale='en' timeStyle='twitter' />
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 100,
    cell: ({ row }) => {
      const document = row.original;
      return <CellAction data={document} />;
    }
  }
];

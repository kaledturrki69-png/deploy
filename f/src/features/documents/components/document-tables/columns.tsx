'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Document } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { DocumentService } from '@/services/documentService';
import { CellAction } from '@/features/documents/components/document-tables/cell-action';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export const columns: ColumnDef<Document>[] = [
  {
    accessorKey: 'filename',
    header: 'Filename',
    cell: ({ row }) => {
      const filename = row.getValue('filename') as string;
      return (
        <div className='flex items-center space-x-2'>
          <div className='font-medium'>{String(filename || 'Unknown')}</div>
        </div>
      );
    }
  },
  {
    accessorKey: 'candidate',
    header: 'Candidate',
    cell: ({ row }) => {
      const candidate = row.getValue('candidate') as Document['candidate'];
      if (
        !candidate ||
        typeof candidate !== 'object' ||
        !candidate.first_name ||
        !candidate.last_name
      ) {
        return <span className='text-muted-foreground'>-</span>;
      }
      return (
        <div className='font-medium'>
          {candidate.first_name} {candidate.last_name}
        </div>
      );
    }
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: ({ row }) => {
      const size = row.getValue('size') as number;
      return (
        <div className='text-muted-foreground text-sm'>
          {DocumentService.formatFileSize(size)}
        </div>
      );
    }
  },
  {
    accessorKey: 'doc_type',
    header: 'Type',
    cell: ({ row }) => {
      const docType = row.getValue('doc_type') as string;
      return (
        <Badge variant='outline' className='capitalize'>
          {String(docType || 'unknown')}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) => {
      const source = String(row.getValue('source') || 'upload');

      const getSourceIcon = (source: string) => {
        switch (source.toLowerCase()) {
          case 'web':
          case 'web_app':
            return '/assets/upload.svg';
          case 'mobile':
          case 'mobile_app':
            return '/assets/android.svg';
          case 'phone':
          case 'phone_app':
            return '/assets/email.svg';
          default:
            return '/assets/upload.svg';
        }
      };

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
        <div className='flex items-center space-x-2'>
          <Image
            src={getSourceIcon(source)}
            alt={getSourceLabel(source)}
            width={16}
            height={16}
            className='h-4 w-4'
          />
          <span className='text-sm font-medium'>{getSourceLabel(source)}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'processing_status',
    header: 'Status',
    cell: ({ row }) => {
      const status = String(row.getValue('processing_status') || 'pending');
      const progress = row.original.processing_progress;

      const getStatusVariant = (status: string) => {
        switch (status) {
          case 'completed':
          case 'success':
            return 'default';
          case 'processing':
            return 'secondary';
          case 'pending':
            return 'outline';
          case 'failed':
          case 'error':
            return 'destructive';
          default:
            return 'outline';
        }
      };

      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'completed':
          case 'success':
            return <CheckCircle className='h-4 w-4 text-green-600' />;
          case 'processing':
            return <Loader2 className='h-4 w-4 animate-spin text-blue-600' />;
          case 'pending':
            return <Loader2 className='h-4 w-4 animate-spin text-blue-600' />;
          case 'failed':
          case 'error':
            return <XCircle className='h-4 w-4 text-red-600' />;
          default:
            return <Clock className='h-4 w-4 text-yellow-600' />;
        }
      };

      return (
        <div className='flex items-center space-x-2'>
          {getStatusIcon(status)}
          <Badge variant={getStatusVariant(status)}>{status}</Badge>
          {status === 'processing' && (
            <span className='text-muted-foreground text-xs'>{progress}%</span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'uploaded_at',
    header: 'Uploaded',
    cell: ({ row }) => {
      const uploadedAt = row.getValue('uploaded_at');
      const date = uploadedAt ? new Date(uploadedAt as string) : new Date();

      if (isNaN(date.getTime())) {
        return <div className='text-muted-foreground text-sm'>Invalid date</div>;
      }

      // Use consistent formatting to avoid hydration mismatch
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      return (
        <div className='text-muted-foreground text-sm'>{formatDate(date)}</div>
      );
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const document = row.original;
      return <CellAction data={document} />;
    }
  }
];

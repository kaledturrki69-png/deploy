'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { DocumentService } from '@/services/documentService';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function UploadSection() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const t = useTranslations('upload_section');
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const documentFiles = files.filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    setUploadedFiles((prev) => [...prev, ...documentFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const documentFiles = files.filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    setUploadedFiles((prev) => [...prev, ...documentFiles]);
  };

  const removeFile = (index: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (!uploadedFiles.length) {
      toast.error(t('select_file_error'));
      return;
    }
    if (!session?.accessToken) {
      toast.error(t('auth_required'));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/documents/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.error || t('upload_failed')
        );
      }

      toast.success(t('upload_success', { count: uploadedFiles.length }));

      setUploadedFiles([]);
      router.push(`/${locale}/dashboard/upload-cv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('upload_error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>{t('upload_documents')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Drag & Drop Area */}
          <div
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300',
              'hover:border-primary/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className='flex flex-col items-center justify-center space-y-3'>
              <div className='rounded-full bg-gray-100 p-4'>
                <IconPlus className='h-10 w-10 text-gray-400' />
              </div>
              <div className='space-y-2'>
                <p className='text-base font-medium text-gray-700'>
                  {t('drag_drop')}
                </p>
                <p className='text-sm text-gray-500'>{t('click_browse')}</p>
              </div>
              <div className='text-xs text-gray-400'>{t('supports_files')}</div>
              <input
                type='file'
                multiple
                accept='.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                className='hidden'
                id='file-upload'
                onChange={handleFileChange}
              />
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-upload')?.click();
                }}
              >
                {t('browse_files')}
              </Button>
            </div>
          </div>

          {/* Uploaded Files Table */}
          {uploadedFiles.length > 0 && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-semibold'>
                  {t('selected_files')} ({uploadedFiles.length})
                </h4>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setUploadedFiles([])}
                  className='text-xs'
                >
                  {t('clear_all')}
                </Button>
              </div>
              <div className='max-h-[300px] overflow-auto rounded-lg border'>
                <table className='w-full table-auto text-sm md:table-fixed'>
                  <thead className='bg-muted sticky top-0 border-b'>
                    <tr>
                      <th className='p-3 text-left text-xs font-medium text-gray-500'>
                        {t('file_name')}
                      </th>
                      <th className='p-3 text-left text-xs font-medium text-gray-500'>
                        {t('size')}
                      </th>
                      <th className='w-16 p-3'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file, index) => (
                      <tr
                        key={index}
                        className='border-b transition-colors last:border-0 hover:bg-gray-50'
                      >
                        <td className='p-3'>
                          <p className='text-sm font-medium break-words'>
                            {file.name}
                          </p>
                        </td>
                        <td className='p-3'>
                          <p className='text-sm text-gray-500'>
                            {DocumentService.formatFileSize(file.size)}
                          </p>
                        </td>
                        <td className='p-3 text-right'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeFile(index)}
                            className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
                          >
                            <IconX className='h-4 w-4' />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons - always inside the card, always visible */}
          <div className='flex justify-end space-x-3 pt-4 border-t mt-4'>
            <Button
              variant='outline'
              onClick={() => router.push(`/${locale}/dashboard/upload-cv`)}
              disabled={isUploading}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadedFiles.length || isUploading}
              size='lg'
            >
              {isUploading
                ? t('uploading')
                : uploadedFiles.length > 0
                  ? uploadedFiles.length === 1
                    ? t('upload_files', { count: uploadedFiles.length })
                    : t('upload_files_plural', { count: uploadedFiles.length })
                  : t('upload')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
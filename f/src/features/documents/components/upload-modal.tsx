'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconPlus, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { DocumentService } from '@/services/documentService';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface UploadModalProps {
  children: React.ReactNode;
  currentFile?: { name: string; size: string };
  mode?: 'upload' | 'update';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadModal({
  children,
  currentFile,
  mode = 'upload',
  isOpen: externalIsOpen,
  onOpenChange
}: UploadModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen ?? internalIsOpen;
  const setIsOpen = onOpenChange ?? setInternalIsOpen;
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations('upload_modal');

  React.useEffect(() => {
    if (mode === 'update' && currentFile && isOpen) {
      setUploadedFiles([new File([], currentFile.name)]);
    }
  }, [mode, currentFile, isOpen]);

  React.useEffect(() => {
    if (!isOpen) setUploadedFiles([]);
  }, [isOpen]);

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
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch(`${API_URL}/api/v1/documents/`, {
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
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('upload_error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'update' ? t('update_document') : t('upload_document')}
          </DialogTitle>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className='flex flex-col items-center justify-center space-y-2'>
              <IconPlus className='h-8 w-8 text-gray-400' />
              <p className='text-sm text-gray-600'>{t('drag_drop_select')}</p>
              <p className='text-xs text-gray-500'>{t('supports_files')}</p>
              <input
                type='file'
                multiple
                accept='.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                className='hidden'
                id='file-upload'
                onChange={handleFileChange}
              />
              <label
                htmlFor='file-upload'
                className='text-primary cursor-pointer text-sm font-medium hover:underline'
                onClick={(e) => e.stopPropagation()}
              >
                {t('browse_files')}
              </label>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>{t('selected_files')}</h4>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between rounded bg-gray-50 p-2'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{file.name}</p>
                    <p className='text-xs text-gray-500'>
                      {DocumentService.formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeFile(index)}
                    className='h-8 w-8 p-0'
                  >
                    <IconX className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className='flex justify-end space-x-2'>
            <Button
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadedFiles.length || isUploading}
            >
              {isUploading ? t('uploading') : t('upload')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

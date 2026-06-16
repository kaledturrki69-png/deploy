'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { GridCardView, DataTableView } from '@/components/views';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Search,
  User,
  Calendar,
  MapPin,
  Grid3X3,
  List,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { CandidateService } from '@/services/candidate-service';
import { CandidateAPI, ResumeAPI } from '@/types/candidate-api';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/use-page-title';

// Combined interface for display
interface CandidateWithResume extends Omit<CandidateAPI, 'location'> {
  resume?: ResumeAPI;
  position?: string;
  tags?: string[];
  description?: string;
  experience?: Array<{
    title: string;
    company: string;
    years: string;
  }>;
  location?: string; // Override location to use resume data
}

export default function CandidatesPage() {
  const t = useTranslations('CandidatesPage');
  usePageTitle('Candidates');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [candidates, setCandidates] = useState<CandidateWithResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const { data: session } = useSession();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: string;
    candidateId?: number;
  }>({
    isOpen: false,
    action: ''
  });

  // Dynamic items per page based on view mode
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  // Helper function to construct photo URL from base64 or URL
  const getPhotoUrl = (photo: any) => {
    if (!photo) return '';

    // If photo is an object with base64 data
    if (typeof photo === 'object' && photo.base64) {
      // Return data URL for base64 image
      return `data:image/jpeg;base64,${photo.base64}`;
    }

    // If photo is a string (old format or URL)
    if (typeof photo === 'string') {
      // If it's already a full URL, return it as is
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return photo;
      }
      // If it's a relative path, prepend API base URL
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';
      return `${API_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
    }

    return '';
  };

  // Fetch candidates and resumes data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [candidatesData, resumesData] = await Promise.all([
          CandidateService.getCandidates(session.accessToken),
          CandidateService.getResumes(session.accessToken)
        ]);

        // Combine candidates with their resumes and extract display data
        const candidatesWithResumes: CandidateWithResume[] = candidatesData.map(
          (candidate) => {
            const resume = resumesData.find(
              (r) => r.candidate.id === candidate.id
            );
            const jsonData = resume?.json_data;

            return {
              ...candidate,
              resume,
              position: jsonData?.title || 'No position',
              tags:
                jsonData?.experience?.flatMap(
                  (exp) =>
                    exp.positions?.flatMap(
                      (pos) =>
                        pos.skillsUsed?.technologies?.map(
                          (tech) => tech.name
                        ) || []
                    ) || []
                ) || [],
              description:
                jsonData?.summary?.[0]?.summary || 'No description available',
              experience:
                jsonData?.experience?.map((exp) => ({
                  title: exp.positions?.[0]?.title || 'Unknown',
                  company: exp.company,
                  years: `${exp.positions?.[0]?.from_} - ${exp.positions?.[0]?.to}`
                })) || [],
              // Use location from resume JSON data if available, otherwise fall back to API location
              location:
                jsonData?.location || candidate.location || 'No location'
            };
          }
        );

        setCandidates(candidatesWithResumes);
      } catch (error) {
        toast.error(t('load_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken, t]);

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.position &&
        candidate.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.tags &&
        candidate.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  // Reset to page 1 when search changes or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, viewMode]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select ALL candidates in the entire filtered list, not just current page
      const allIds = new Set(filteredCandidates.map((c) => c.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id as number);
    } else {
      newSelected.delete(id as number);
    }
    setSelectedRows(newSelected);
  };

  // Action handlers
  const handleAction = (action: string, candidateId?: number) => {
    setActionDialog({
      isOpen: true,
      action,
      candidateId
    });
  };

  // Bulk action handler
  const handleBulkAction = (action: string) => {
    if (selectedRows.size === 0) {
      toast.warning(t('select_one'));
      return;
    }
    setActionDialog({
      isOpen: true,
      action: `bulk-${action}`,
      candidateId: undefined
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin' />
          <span className='ml-2'>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen flex-col'>
      <div className='flex flex-1 flex-col overflow-hidden'>
        <div ref={scrollContainerRef} className='flex-1 overflow-y-auto pb-10'>
          <div className='container mx-auto p-6'>
            {/* Header with Title, Search, and View Toggle */}
            <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
              {/* Title */}
              <div>
                <h1 className='text-3xl font-bold'>{t('candidates')}</h1>
                <p className='text-muted-foreground text-sm'>{t('subtitle')}</p>
              </div>

              {/* Search and View Toggle */}
              <div className='flex items-center gap-4'>
                <div className='relative w-64'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* View Toggle Buttons */}
                <div className='flex items-center space-x-2'>
                  <span className='text-muted-foreground text-sm'>View:</span>
                  <div className='flex rounded-lg border border-gray-200 p-1'>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('grid')}
                      className='h-8 w-8 p-0'
                    >
                      <Grid3X3 className='h-4 w-4' />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setViewMode('table')}
                      className='h-8 w-8 p-0'
                    >
                      <List className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates Content */}
            {viewMode === 'grid' ? (
              <>
                <GridCardView
                  items={paginatedCandidates.map((candidate) => ({
                    id: candidate.id,
                    title: candidate.full_name,
                    subtitle: candidate.position,
                    description: candidate.description,
                    avatar: (
                      <div className='bg-primary/10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full'>
                        {getPhotoUrl(candidate.photo) ? (
                          <Image
                            src={getPhotoUrl(candidate.photo)}
                            alt={candidate.full_name}
                            width={48}
                            height={48}
                            className='h-full w-full object-cover'
                            unoptimized
                          />
                        ) : (
                          <User className='text-primary h-6 w-6' />
                        )}
                      </div>
                    ),
                    details: [
                      {
                        icon: (
                          <Calendar className='text-muted-foreground h-4 w-4' />
                        ),
                        label: '',
                        value:
                          candidate.experience?.[0]?.years || 'No experience'
                      },
                      {
                        icon: (
                          <MapPin className='text-muted-foreground h-4 w-4' />
                        ),
                        label: '',
                        value: candidate.location || 'No location'
                      }
                    ],
                    extraContent: (
                      <div className='flex flex-wrap gap-1'>
                        {candidate.tags?.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant='secondary'
                            className='text-xs'
                          >
                            {tag}
                          </Badge>
                        ))}
                        {(candidate.tags?.length || 0) > 3 && (
                          <Badge variant='secondary' className='text-xs'>
                            +{(candidate.tags?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>
                    ),
                    actionButton: {
                      label: t('view_cv'),
                      onClick: () => {
                        router.push(
                          `/${locale}/dashboard/candidates/${candidate.id}`
                        );
                      }
                    }
                  }))}
                  /*    emptyState={{
                    icon: (
                      <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    ),
                    title: t('no_results_title'),
                    description: t('no_results_description')
                  }} */
                />

                {/* Pagination Controls - Grid View */}
                {totalPages > 1 && (
                  <div className='mt-8 mb-6 flex flex-wrap items-center justify-between gap-3'>
                    <div className='text-muted-foreground text-sm'>
                      {t('showing', {
                        start: startIndex + 1,
                        end: Math.min(endIndex, filteredCandidates.length),
                        total: filteredCandidates.length
                      })}
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(1, prev - 1));
                          scrollContainerRef.current?.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className='flex flex-wrap items-center gap-1'>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? 'default' : 'outline'
                            }
                            size='sm'
                            onClick={() => {
                              setCurrentPage(page);
                              scrollContainerRef.current?.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                              });
                            }}
                            className='h-8 w-8 p-0'
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          );
                          scrollContainerRef.current?.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }}
                        disabled={currentPage === totalPages}
                      >
                        {t('next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <DataTableView
                  data={paginatedCandidates}
                  getRowId={(candidate) => candidate.id}
                  columns={[
                    {
                      key: 'full_name',
                      header: t('name'),
                      minWidth: 'min-w-[150px]',
                      cellClassName: 'font-medium whitespace-nowrap'
                    },
                    {
                      key: 'position',
                      header: t('position'),
                      minWidth: 'min-w-[180px]',
                      cellClassName:
                        'max-w-[250px] break-words whitespace-normal'
                    },
                    {
                      key: 'contact',
                      header: t('contact'),
                      minWidth: 'min-w-[200px]',
                      render: (candidate) => (
                        <div className='flex flex-col space-y-1'>
                          <span className='truncate text-sm'>
                            {candidate.email1 || 'No email'}
                          </span>
                          <span className='text-muted-foreground text-xs whitespace-nowrap'>
                            {candidate.phone1 || 'No phone'}
                          </span>
                        </div>
                      )
                    }
                  ]}
                  selection={{
                    enabled: true,
                    selectedIds: selectedRows,
                    onSelectAll: handleSelectAll,
                    onSelectRow: handleSelectRow,
                    selectionMenuItems: [
                      {
                        label: t('clear_selection'),
                        onClick: () => setSelectedRows(new Set())
                      },
                      {
                        label: t('select_by_position'),
                        onClick: () => handleAction('select-by-position'),
                        separator: true
                      },
                      {
                        label: t('select_by_location'),
                        onClick: () => handleAction('select-by-location')
                      }
                    ],
                    bulkActions: [
                      {
                        label: 'Send Email to Selected',
                        onClick: () => handleBulkAction('send-email')
                      },
                      {
                        label: t('schedule_interview'),
                        onClick: () => handleBulkAction('schedule-interview')
                      }
                    ]
                  }}
                  selectionInfo={
                    selectedRows.size > 0 ? (
                      <div className='mb-4 flex items-center justify-between rounded-md border bg-blue-50 p-3'>
                        <span className='text-sm font-medium text-blue-900'>
                          {selectedRows.size} candidate
                          {selectedRows.size !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setSelectedRows(new Set())}
                          className='text-blue-900 hover:text-blue-700'
                        >
                          {t('clear_selection')}
                        </Button>
                      </div>
                    ) : undefined
                  }
                  actionColumn={{
                    header: t('action'),
                    width: '120px',
                    buttons: [
                      {
                        label: t('view_cv'),
                        onClick: (candidate) =>
                          router.push(
                            `/${locale}/dashboard/candidates/${candidate.id}`
                          )
                      }
                    ],
                    dropdownActions: [
                      {
                        label: t('send_email'),
                        onClick: (candidate) =>
                          handleAction('send-email', candidate.id)
                      },
                      {
                        label: t('schedule_interview'),
                        onClick: (candidate) =>
                          handleAction('schedule-interview', candidate.id)
                      }
                    ]
                  }}
                  pagination={{
                    currentPage,
                    totalItems: filteredCandidates.length,
                    itemsPerPage,
                    onPageChange: (page) => {
                      setCurrentPage(page);
                      scrollContainerRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    },
                    showingText: t('showing', {
                      start: startIndex + 1,
                      end: Math.min(endIndex, filteredCandidates.length),
                      total: filteredCandidates.length
                    }),
                    previousText: t('previous'),
                    nextText: t('next')
                  }}
                />
              </>
            )}

            {filteredCandidates.length === 0 && (
              <div className='py-12 text-center'>
                <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <h3 className='mb-2 text-lg font-semibold'>
                  {t('no_results_title')}
                </h3>
                <p className='text-muted-foreground'>
                  {t('no_results_description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.isOpen}
        onOpenChange={(open) => setActionDialog({ isOpen: open, action: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'select-by-position' &&
                'Select by Position'}
              {actionDialog.action === 'select-by-location' &&
                'Select by Location'}
              {actionDialog.action === 'send-email' && 'Send Email'}
              {actionDialog.action === 'schedule-interview' &&
                'Schedule Interview'}
              {actionDialog.action === 'bulk-send-email' &&
                `Send Email to ${selectedRows.size} Candidate${selectedRows.size !== 1 ? 's' : ''}`}
              {actionDialog.action === 'bulk-schedule-interview' &&
                `Schedule Interview for ${selectedRows.size} Candidate${selectedRows.size !== 1 ? 's' : ''}`}
            </DialogTitle>
          </DialogHeader>
          {/* Empty content - to be implemented */}
          <div className='text-muted-foreground py-8 text-center'>
            {actionDialog.action?.startsWith('bulk-') ? (
              <div>
                <p className='mb-2 font-medium'>
                  {selectedRows.size} {t('candidate')}
                  {selectedRows.size !== 1 ? 's' : ''} {t('selected')}
                </p>
                <p>{t('feature_soon')}</p>
              </div>
            ) : (
              <p>{t('feature_soon')}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

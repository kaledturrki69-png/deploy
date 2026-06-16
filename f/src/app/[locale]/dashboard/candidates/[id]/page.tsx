'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Loader2,
  FileText,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CVTemplate from '../../../../../components/cv-template';
import { CandidateService } from '@/services/candidate-service';
import { CandidateAPI, ResumeAPI } from '@/types/candidate-api';
import { formatCandidateForCV } from '@/lib/format-cv-data';

const PDFViewer = dynamic(
  () =>
    import('@/features/documents/components/file-preview/pdf-viewer').then(
      (mod) => ({ default: mod.PDFViewer })
    ),
  { ssr: false }
);

// ---- Types ----
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
  skills?: string[];
  languages?: string[];
  location?: string;
}

// ---- Helper Components ----
const BadgeList = ({
  items,
  variant,
  emptyText
}: {
  items?: string[];
  variant: 'secondary' | 'outline';
  emptyText: string;
}) => (
  <div className='flex flex-wrap gap-1'>
    {items && items.length > 0 ? (
      items.map((item, index) => (
        <Badge key={index} variant={variant} className='text-xs'>
          {item}
        </Badge>
      ))
    ) : (
      <span className='text-muted-foreground text-sm'>{emptyText}</span>
    )}
  </div>
);

// ---- Page ----
export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [candidate, setCandidate] = useState<CandidateWithResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

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

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const candidateId = parseInt(id as string, 10);

        const [candidateData, resumesData] = await Promise.all([
          CandidateService.getCandidate(candidateId, session.accessToken),
          CandidateService.getResumes(session.accessToken)
        ]);

        const resume = resumesData.find((r) => r.candidate.id === candidateId);
        const jsonData = resume?.json_data;

        // ---- Clean extracted data ----
        const skills = (
          jsonData?.experience?.flatMap(
            (exp) =>
              exp.positions?.flatMap(
                (pos) =>
                  pos.skillsUsed?.technologies?.map((tech) => tech.name) || []
              ) || []
          ) || []
        ).filter(Boolean);

        const languages = (
          jsonData?.languages?.map((lang) => lang.language) || []
        ).filter(Boolean);

        const experience =
          jsonData?.experience?.map((exp) => ({
            title: exp.positions?.[0]?.title || 'Unknown',
            company: exp.company,
            years: `${exp.positions?.[0]?.from_ || ''} - ${
              exp.positions?.[0]?.to || ''
            }`
          })) || [];

        const candidateWithResume: CandidateWithResume = {
          ...candidateData,
          resume,
          position: jsonData?.title || 'No position',
          tags: skills,
          description: jsonData?.summary?.[0]?.summary || 'No description',
          experience,
          skills,
          languages,
          location:
            jsonData?.location || candidateData.location || 'No location'
        };

        setCandidate(candidateWithResume);
      } catch (error) {
        toast.error('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id, session?.accessToken]);

  // Fetch PDF for original CV tab
  useEffect(() => {
    const fetchPDF = async () => {
      if (!candidate?.resume?.document) return;

      setLoadingPdf(true);
      try {
        const res = await fetch(
          `/api/documents/${candidate.resume.document}/download`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF: ${res.status}`);
        }
        const blob = await res.blob();
        if (blob.size === 0) {
          throw new Error('Received an empty file from the server');
        }
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        toast.error('Failed to load original CV');
        setPdfUrl(null);
      } finally {
        setLoadingPdf(false);
      }
    };

    fetchPDF();
  }, [candidate?.resume?.document]);

  // ---- Loading State ----
  if (loading) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center space-y-4 p-8'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        <span className='text-muted-foreground text-sm'>
          Loading candidate details...
        </span>
      </div>
    );
  }

  // ---- Not Found ----
  if (!candidate) {
    return (
      <div className='flex h-screen flex-col overflow-hidden'>
        <div className='flex-1 overflow-y-auto p-4 pt-0'>
          <div className='py-12 text-center'>
            <h1 className='mb-4 text-2xl font-bold'>Candidate not found</h1>
            <p className='text-muted-foreground mb-4'>
              The candidate you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className='flex h-screen flex-col overflow-hidden'>
      <div className='flex-1 overflow-y-auto p-4 pt-0'>
        <div className='space-y-6'>
          {/* Header */}
          <div>
            <Button
              variant='ghost'
              onClick={() => router.back()}
              className='mb-4 h-8 px-2 lg:px-3'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Candidates
            </Button>

            <h1 className='text-3xl font-bold tracking-tight'>
              {candidate.full_name}
            </h1>
            <p className='text-muted-foreground'>{candidate.position}</p>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Sidebar */}
            <div className='space-y-6 lg:col-span-1'>
              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <Mail className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>
                      {candidate.email1 || 'No email'}
                    </span>
                  </div>
                  {candidate.email2 && (
                    <div className='flex items-center space-x-3'>
                      <Mail className='text-muted-foreground h-4 w-4' />
                      <span className='text-sm'>
                        {candidate.email2 || 'No email'}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center space-x-3'>
                    <Phone className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>
                      {candidate.phone1 || 'No phone'}
                    </span>
                  </div>
                  {candidate.phone2 && (
                    <div className='flex items-center space-x-3'>
                      <Phone className='text-muted-foreground h-4 w-4' />
                      <span className='text-sm'>
                        {candidate.phone2 || 'No phone'}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center space-x-3'>
                    <Linkedin className='text-muted-foreground h-4 w-4' />
                    {candidate.resume?.json_data?.linkedin ? (
                      <a
                        href={candidate.resume.json_data.linkedin}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:underline'
                      >
                        {candidate.resume.json_data.linkedin}
                      </a>
                    ) : (
                      <span className='text-muted-foreground text-sm italic'>
                        None
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground text-sm'>
                      Location
                    </span>
                    <span className='text-sm'>
                      {candidate.location || 'No location'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Languages */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Languages</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <h4 className='mb-2 text-sm font-medium'>Skills</h4>
                    <BadgeList
                      items={candidate.skills}
                      variant='secondary'
                      emptyText='No skills listed'
                    />
                  </div>
                  <div>
                    <h4 className='mb-2 text-sm font-medium'>Languages</h4>
                    <BadgeList
                      items={candidate.languages}
                      variant='outline'
                      emptyText='No languages listed'
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CV Tabs */}
            <div className='lg:col-span-2'>
              <Card>
                {/* <CardHeader>
                  <CardTitle>Curriculum Vitae</CardTitle>
                  <p className='text-muted-foreground text-sm'>
                    View the candidate&apos;s CV in template or original format
                  </p>
                </CardHeader> */}
                <CardContent>
                  <Tabs defaultValue='template' className='w-full'>
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='template'>
                        <FileText className='mr-2 h-4 w-4' />
                        CV Template
                      </TabsTrigger>
                      <TabsTrigger value='original'>
                        <Eye className='mr-2 h-4 w-4' />
                        Original CV
                      </TabsTrigger>
                    </TabsList>

                    {/* CV Template Tab */}
                    <TabsContent value='template' className='mt-4'>
                      <div className='h-[70vh] overflow-y-auto rounded-lg border'>
                        <CVTemplate
                          candidate={formatCandidateForCV({
                            id: candidate.id,
                            first_name: candidate.first_name,
                            last_name: candidate.last_name,
                            full_name: candidate.full_name,
                            email1: candidate.email1,
                            phone1: candidate.phone1,
                            location: candidate.location,
                            position: candidate.position,
                            tags: candidate.tags,
                            description: candidate.description,
                            skills: candidate.skills,
                            languages: candidate.languages,
                            resume: candidate.resume,
                            avatar: getPhotoUrl(
                              candidate.resume?.candidate?.photo
                            )
                          })}
                        />
                      </div>
                    </TabsContent>

                    {/* Original CV Tab */}
                    <TabsContent value='original' className='mt-4'>
                      <div className='h-[70vh] overflow-hidden rounded-lg border'>
                        {loadingPdf ? (
                          <div className='flex h-full items-center justify-center'>
                            <div className='flex items-center gap-2'>
                              <Loader2 className='h-6 w-6 animate-spin' />
                              <span>Loading PDF...</span>
                            </div>
                          </div>
                        ) : pdfUrl ? (
                          <PDFViewer
                            documentId={candidate.resume?.document || 0}
                            filename={`${candidate.full_name}_CV.pdf`}
                            fileUrl={pdfUrl}
                            onClose={() => setPdfUrl(null)}
                          />
                        ) : (
                          <div className='flex h-full items-center justify-center text-center'>
                            <div>
                              <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                              <p className='text-muted-foreground'>
                                No original CV available
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

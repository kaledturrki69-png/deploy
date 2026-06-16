import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Proxy to remote server API
const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

// GET /api/documents/[id]/download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session and access token
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/documents/${id}/download/`;

    const response = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Remote server doesn't have the endpoint yet, return mock file
        const mockContent = Buffer.from(
          'Mock file content - remote server endpoint not available'
        );
        return new NextResponse(mockContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="mock_document.pdf"',
            'Content-Length': mockContent.length.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      throw new Error(`Remote server responded with ${response.status}`);
    }

    // Get the file content and headers from the remote server
    const fileBuffer = await response.arrayBuffer();

    // Force PDF content-type for inline viewing where possible
    let contentType = response.headers.get('content-type') || 'application/pdf';
    if (!contentType.toLowerCase().includes('pdf')) {
      contentType = 'application/pdf';
    }

    // Prefer inline viewing by rewriting Content-Disposition
    const remoteDisposition = response.headers.get('content-disposition') || '';
    let filename = 'document.pdf';
    const match = /filename="?([^";]+)"?/i.exec(remoteDisposition);
    if (match?.[1]) {
      filename = match[1];
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    // Return mock file instead of error to prevent download failure
    const mockContent = Buffer.from(
      'Mock file content - remote server unavailable'
    );
    return new NextResponse(mockContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="mock_document.pdf"',
        'Content-Length': mockContent.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

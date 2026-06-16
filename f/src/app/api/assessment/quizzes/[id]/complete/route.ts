import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const quizId = resolvedParams.id;
    const body = await request.json().catch(() => ({}));

    const response = await fetch(
      `${REMOTE_API_BASE}/api/v1/assessment/quizzes/${quizId}/complete/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to complete quiz instance'
      }));
      logger.error('Failed to complete quiz instance', {
        quizId,
        status: response.status,
        error: errorData
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error completing quiz instance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

export async function PUT(
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
    const body = await request.json();

    const response = await fetch(
      `${REMOTE_API_BASE}/api/v1/assessment/quizzes/${quizId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to update quiz instance'
      }));
      logger.error('Failed to update quiz instance', {
        quizId,
        status: response.status,
        error: errorData
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error updating quiz instance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    const response = await fetch(
      `${REMOTE_API_BASE}/api/v1/assessment/quizzes/${quizId}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to update quiz instance'
      }));
      logger.error('Failed to update quiz instance', {
        quizId,
        status: response.status,
        error: errorData
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error updating quiz instance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const response = await fetch(
      `${REMOTE_API_BASE}/api/v1/assessment/quizzes/${quizId}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to delete quiz instance'
      }));
      logger.error('Failed to delete quiz instance', {
        quizId,
        status: response.status,
        error: errorData
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    // DELETE returns 204 No Content, so return success without body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Error deleting quiz instance', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

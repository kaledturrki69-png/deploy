import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

// POST /api/quiz/generate - Generate a new quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { template_id, candidate_id, question_count } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    const payloadCandidateId =
      candidate_id !== undefined && candidate_id !== null ? candidate_id : 0;

    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/public/generate_quiz/`;

    const response = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        template_id,
        candidate_id: payloadCandidateId,
        recruiter_id: session.user.id,
        ...(question_count ? { question_count: Number(question_count) } : {})
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('Error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If response is HTML (Django error page), try to extract error message
        if (
          errorText.includes('<!DOCTYPE html>') ||
          errorText.includes('<html')
        ) {
          // Try to extract the exception value from HTML
          const exceptionMatch = errorText.match(
            /Exception Value:<\/th>\s*<td[^>]*><pre[^>]*>([\s\S]*?)<\/pre>/
          );
          const exceptionTypeMatch = errorText.match(
            /Exception Type:<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/
          );

          const exceptionType = exceptionTypeMatch
            ? exceptionTypeMatch[1].trim()
            : 'Server Error';
          const exceptionValue = exceptionMatch
            ? exceptionMatch[1].trim()
            : 'Unknown error occurred';

          errorData = {
            error: exceptionType,
            message: exceptionValue,
            details:
              'This is a backend error. Please contact the backend team to fix the issue.',
            attemptedUrl: remoteUrl
          };
        } else {
          errorData = {
            error: 'Failed to generate quiz',
            message: errorText || 'Unknown error occurred',
            attemptedUrl: remoteUrl
          };
        }
      }

      return NextResponse.json(errorData, { status: response.status });
    }

    // Try to parse JSON response, but handle empty responses
    let data;
    const responseText = await response.text();
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: 'Quiz generated successfully' };
      }
    } else {
      data = { message: 'Quiz generated successfully' };
    }

    return NextResponse.json(data);
  } catch (error) {
    //console.error('Error generating quiz:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

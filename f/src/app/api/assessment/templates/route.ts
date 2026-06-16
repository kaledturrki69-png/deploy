import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

// GET /api/assessment/templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skill_id');
    const level = searchParams.get('level'); // low or expert

    const djangoParams = new URLSearchParams();
    if (skillId) {
      djangoParams.set('skill', skillId);
    }

    const queryString = djangoParams.toString()
      ? `?${djangoParams.toString()}`
      : '';
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/${queryString}`;

    const response = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([]);
      }

      if (response.status === 401) {
        let errBody: any = null;
        try {
          errBody = await response.json();
        } catch {
          try {
            const txt = await response.text();
            errBody = { error: txt || 'Authentication token expired' };
          } catch {
            errBody = { error: 'Authentication token expired' };
          }
        }
        return NextResponse.json(
          typeof errBody === 'object' && errBody !== null
            ? errBody
            : { error: String(errBody) },
          { status: 401 }
        );
      }

      throw new Error(`Remote server responded with ${response.status}`);
    }

    let data = await response.json();

    // Filter by level if provided
    if (level === 'low' || level === 'expert') {
      data = Array.isArray(data) ? data : [];
      // Map difficulty_mix_mode to levels
      // 'uniform' or default might be 'low'
      // 'progressive' or 'custom' might be 'expert'
      if (level === 'low') {
        data = data.filter(
          (template: any) =>
            template.difficulty_mix_mode === 'uniform' ||
            !template.difficulty_mix_mode
        );
      } else if (level === 'expert') {
        data = data.filter(
          (template: any) =>
            template.difficulty_mix_mode === 'progressive' ||
            template.difficulty_mix_mode === 'custom'
        );
      }
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/assessment/templates - Create a new quiz template
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
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/`;

    const response = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      // Log error details for debugging
      logger.error('Quiz template creation failed', {
        status: response.status,
        statusText: response.statusText,
        body: data,
        payload: body
      });
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error('Quiz template creation error', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create quiz template on server'
      },
      { status: 500 }
    );
  }
}

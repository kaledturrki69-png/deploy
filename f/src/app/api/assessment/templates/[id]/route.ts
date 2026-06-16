import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

// GET /api/assessment/templates/[id] - Get a specific quiz template
export async function GET(
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
    const id = resolvedParams.id;
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/${id}/`;

    const response = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Quiz template not found' },
          { status: 404 }
        );
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

      let errBody: any = null;
      try {
        errBody = await response.json();
      } catch {
        errBody = { error: 'Failed to fetch quiz template' };
      }
      return NextResponse.json(errBody, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch quiz template from server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/assessment/templates/[id] - Update a quiz template (full update)
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
    const id = resolvedParams.id;
    const body = await request.json();
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/${id}/`;

    const response = await fetch(remoteUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errBody: any = null;
      try {
        errBody = await response.json();
      } catch {
        try {
          const txt = await response.text();
          errBody = { error: txt || 'Update failed' };
        } catch {
          errBody = { error: 'Update failed' };
        }
      }
      return NextResponse.json(
        typeof errBody === 'object' && errBody !== null
          ? errBody
          : { error: String(errBody) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update quiz template from server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/assessment/templates/[id] - Partially update a quiz template
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
    const id = resolvedParams.id;
    const body = await request.json();
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/${id}/`;

    const response = await fetch(remoteUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errBody: any = null;
      try {
        errBody = await response.json();
      } catch {
        try {
          const txt = await response.text();
          errBody = { error: txt || 'Update failed' };
        } catch {
          errBody = { error: 'Update failed' };
        }
      }
      return NextResponse.json(
        typeof errBody === 'object' && errBody !== null
          ? errBody
          : { error: String(errBody) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update quiz template from server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/assessment/templates/[id] - Delete a quiz template
export async function DELETE(
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
    const id = resolvedParams.id;
    const remoteUrl = `${REMOTE_API_BASE}/api/v1/assessment/templates/${id}/`;

    const response = await fetch(remoteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) {
      let errBody: any = null;
      try {
        errBody = await response.json();
      } catch {
        try {
          const txt = await response.text();
          errBody = { error: txt || 'Delete failed' };
        } catch {
          errBody = { error: 'Delete failed' };
        }
      }
      return NextResponse.json(
        typeof errBody === 'object' && errBody !== null
          ? errBody
          : { error: String(errBody) },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json({ success: true }, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to delete quiz template from server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

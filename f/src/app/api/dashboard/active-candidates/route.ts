import { NextResponse } from 'next/server';
import {
  requireAuth,
  fetchFromRemote,
  createErrorResponse,
  handleApiError
} from '@/lib/api-route-helpers';

export async function GET() {
  try {
    const session = await requireAuth();

    const response = await fetchFromRemote(
      '/api/v1/dashboard/active-candidates/',
      session.accessToken,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return createErrorResponse(response);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

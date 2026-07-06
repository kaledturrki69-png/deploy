import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFromRemote,
  createErrorResponse,
  handleApiError
} from '@/lib/api-route-helpers';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// GET /api/documents
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from request headers (for client-side calls)
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);

    // Add pagination parameters if not present
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    // Build query parameters for Django API
    const djangoParams = new URLSearchParams();
    djangoParams.set('page', page);
    djangoParams.set('page_size', limit);
    djangoParams.set('limit', limit);
    djangoParams.set('offset', String((parseInt(page) - 1) * parseInt(limit)));

    if (search) {
      djangoParams.set('search', search);
    }

    const endpoint = `${API_ENDPOINTS.DOCUMENTS}?${djangoParams.toString()}`;
    const response = await fetchFromRemote(endpoint, token);

    if (!response.ok) {
      if (response.status === 404) {
        const emptyResponse: any = {
          success: true,
          time: new Date().toISOString(),
          message: 'No documents found - remote server endpoint not available',
          total_documents: 0,
          offset: 0,
          limit: 10,
          documents: []
        };
        return NextResponse.json(emptyResponse);
      }
      return createErrorResponse(response);
    }

    const data = await response.json();

    let responseData: any;
    if (Array.isArray(data)) {
      // Direct array response (no pagination) - implement client-side pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedData = data.slice(startIndex, endIndex);

      responseData = {
        success: true,
        time: new Date().toISOString(),
        message: 'Documents fetched successfully (client-side pagination)',
        total_documents: data.length,
        offset: startIndex,
        limit: limitNum,
        documents: paginatedData
      };
    } else if (data.results && Array.isArray(data.results)) {
      // Django paginated response with results array
      responseData = {
        success: true,
        time: new Date().toISOString(),
        message: 'Documents fetched successfully',
        total_documents: data.count || data.results.length,
        offset: data.offset || 0,
        limit: data.limit || data.results.length,
        documents: data.results
      };
    } else {
      responseData = data;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    const errorResponse = handleApiError(error);
    // Return empty response for documents on error (graceful degradation)
    if (errorResponse.status === 401) {
      return errorResponse;
    }
    const emptyResponse: any = {
      success: true,
      time: new Date().toISOString(),
      message: 'No documents found - remote server unavailable',
      total_documents: 0,
      offset: 0,
      limit: 10,
      documents: []
    };
    return NextResponse.json(emptyResponse);
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Extract formData to preserve multipart boundaries
    const formData = await request.formData();
    const url = API_ENDPOINTS.DOCUMENTS.startsWith('http') 
      ? API_ENDPOINTS.DOCUMENTS 
      : `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
        // Do NOT set Content-Type, native fetch will set it with the correct boundary
      },
      body: formData
    });

    if (!response.ok) {
      return createErrorResponse(response);
    }

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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

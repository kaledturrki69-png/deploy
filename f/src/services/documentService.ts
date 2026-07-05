import {
  Document,
  DocumentUploadRequest,
  DocumentListResponse
} from '@/types/document';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession, signOut } from 'next-auth/react';

const API_BASE_URL = '/api/documents';

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  return '';
}

// Helper function to handle token refresh
async function handleTokenRefresh(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    await signOut({
      redirect: true,
      callbackUrl: '/en/auth/sign-in'
      //callbackUrl: '/en/auth/sign-in?error=SessionExpired'
    });
    return false;
  }
  return false;
}

export class DocumentService {
  // Get all documents with optional filters
  static async getDocuments(params?: {
    page?: number;
    limit?: number;
    ordering?: string;
    search?: string;
  }): Promise<DocumentListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    if (params?.search) searchParams.append('search', params.search);

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${API_BASE_URL}?${searchParams.toString()}`;

    // Get session token for both server and client side
    let headers: HeadersInit = {};
    let session;

    if (typeof window === 'undefined') {
      // Server-side: get session token
      session = await getServerSession(authOptions);
    } else {
      // Client-side: get session token
      session = await getSession();
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // Check if token is expired
      if (response.status === 401) {
        await handleTokenRefresh();
        throw new Error('Authentication token expired. Please log in again.');
      }
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    return response.json();
  }

  // Get a single document by ID
  static async getDocument(id: number): Promise<Document> {
    const baseUrl = getBaseUrl();

    // Get session token for both server and client side
    let headers: HeadersInit = {};
    let session;

    if (typeof window === 'undefined') {
      // Server-side: get session token
      session = await getServerSession(authOptions);
    } else {
      // Client-side: get session token
      session = await getSession();
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${baseUrl}${API_BASE_URL}/${id}`, {
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenRefresh();
        throw new Error('Authentication token expired. Please log in again.');
      }
      throw new Error(
        `Failed to fetch document: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Upload a new document
  static async uploadDocument(
    documentData: DocumentUploadRequest
  ): Promise<Document> {
    const baseUrl = getBaseUrl();

    // Get session token for both server and client side
    let headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    let session;

    if (typeof window === 'undefined') {
      // Server-side: get session token
      session = await getServerSession(authOptions);
    } else {
      // Client-side: get session token
      session = await getSession();
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${baseUrl}${API_BASE_URL}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(documentData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenRefresh();
        throw new Error('Authentication token expired. Please log in again.');
      }
      throw new Error(
        `Failed to upload document: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Download a document
  static async downloadDocument(id: number): Promise<Blob> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${API_BASE_URL}/${id}/download`;

    // Get session token for both server and client side
    let headers: HeadersInit = {};
    let session;

    if (typeof window === 'undefined') {
      // Server-side: get session token
      session = await getServerSession(authOptions);
    } else {
      // Client-side: get session token
      session = await getSession();
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // Check if token is expired
      if (response.status === 401) {
        await handleTokenRefresh();
        throw new Error('Authentication token expired. Please log in again.');
      }
      throw new Error(`Failed to download document: ${response.statusText}`);
    }

    return response.blob();
  }

  // Helper method to format file size
  static formatFileSize(bytes: number | null | undefined): string {
    if (bytes == null || isNaN(bytes)) return '—';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get file extension
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Helper method to determine document type from filename
  static getDocumentTypeFromFilename(
    filename: string
  ): 'pdf' | 'word' | 'doc' | 'docx' {
    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
        return 'doc';
      case 'docx':
        return 'docx';
      default:
        return 'pdf'; // Default to PDF
    }
  }

  // Helper method to get MIME type from filename
  static getMimeTypeFromFilename(filename: string): string {
    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/pdf';
    }
  }

  // Delete a document
  static async deleteDocument(id: number): Promise<void> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${API_BASE_URL}/${id}`;

    // Get session token for both server and client side
    let headers: HeadersInit = {};
    let session;

    if (typeof window === 'undefined') {
      // Server-side: get session token
      session = await getServerSession(authOptions);
    } else {
      // Client-side: get session token
      session = await getSession();
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      // Check if token is expired
      if (response.status === 401) {
        await handleTokenRefresh();
        throw new Error('Authentication token expired. Please log in again.');
      }

      // Try to surface remote error details for better diagnostics
      let errorMessage = 'Failed to delete document';
      try {
        const data = await response.clone().json();
        const msg =
          (data && (data.error || data.detail || data.message)) ?? null;
        if (msg) {
          errorMessage = `${errorMessage}: ${msg}`;
        } else {
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
      } catch {
        try {
          const text = await response.text();
          errorMessage = `${errorMessage}: ${text || `${response.status} ${response.statusText}`}`;
        } catch {
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }
  }
}

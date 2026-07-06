import apiClient from '@/lib/api-client';
import { logger } from '@/lib/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  new_password: string;
}

export interface AuthResponse {
  user: any;
  access: string;
  refresh: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) {
      const errText = await response.text();
      logger.error('Django API Error', new Error(`${response.status} ${errText}`));
      throw new Error(`Login failed: ${response.status} ${errText}`);
    }
    return response.json();
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/accounts/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  // Refresh token
  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response = await apiClient.post('/api/v1/accounts/refresh/', {
      refresh
    });
    return response.data;
  },

  // Logout
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/api/v1/accounts/logout/', { refresh: refreshToken });
  },

  // Get current user
  async getCurrentUser(): Promise<any> {
    const response = await apiClient.get('/api/v1/accounts/user/');
    return response.data;
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<{ detail: string }> {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send reset code');
    }

    return await response.json();
  },

  // Reset password with code
  async resetPassword(data: ResetPasswordData): Promise<{ detail: string }> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reset password');
    }

    return await response.json();
  }
};

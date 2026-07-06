import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import { JWT } from 'next-auth/jwt';
import { authService } from '@/services/auth-service';
import { logger } from '@/lib/logger';

// Define custom types to extend NextAuth's default types
declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    accessToken: string;
    refreshToken: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    };
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    };
    accessToken: string;
    refreshToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const response = await authService.login({
            email: credentials?.email || '',
            password: credentials?.password || ''
          });

          // Decode the JWT token to get user information
          const tokenPayload = JSON.parse(atob(response.access.split('.')[1]));

          // Try different possible field names for first and last name
          const firstName =
            tokenPayload.first_name ||
            tokenPayload.firstName ||
            tokenPayload.given_name ||
            '';
          const lastName =
            tokenPayload.last_name ||
            tokenPayload.lastName ||
            tokenPayload.family_name ||
            '';

          // Create full name from first_name and last_name
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: tokenPayload.user_id.toString(),
            name: fullName || tokenPayload.email.split('@')[0], // Use full name if available, otherwise email prefix
            email: tokenPayload.email,
            role: tokenPayload.email.includes('@') ? 'candidate' : 'employer', // Default role, you might want to get this from token
            firstName: firstName,
            lastName: lastName,
            accessToken: response.access,
            refreshToken: response.refresh
          };
        } catch (error) {
          logger.error('AUTHORIZE ERROR', error as Error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
      } else if (token.accessToken && !token.user?.firstName) {
        // Existing token but missing firstName/lastName - try to extract from token
        try {
          const tokenPayload = JSON.parse(
            atob(token.accessToken.split('.')[1])
          );

          const firstName =
            tokenPayload.first_name ||
            tokenPayload.firstName ||
            tokenPayload.given_name ||
            '';
          const lastName =
            tokenPayload.last_name ||
            tokenPayload.lastName ||
            tokenPayload.family_name ||
            '';

          if (firstName || lastName) {
            token.user = {
              ...token.user,
              firstName: firstName,
              lastName: lastName,
              name: `${firstName} ${lastName}`.trim() || token.user?.name || ''
            };
          }
        } catch (error) {}
      }

      // Check if access token is expired and refresh if needed
      if (token.accessToken && token.refreshToken) {
        try {
          const tokenPayload = JSON.parse(
            atob(token.accessToken.split('.')[1])
          );
          const currentTime = Math.floor(Date.now() / 1000);

          // If token expires in less than 5 minutes, refresh it
          if (tokenPayload.exp - currentTime < 300) {
            const refreshResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com'}/api/v1/auth/token/refresh/`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  refresh: token.refreshToken
                })
              }
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              token.accessToken = refreshData.access;
              token.refreshToken = refreshData.refresh;
            } else {
            }
          }
        } catch (error) {}
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.accessToken = token.accessToken;
      }
      return session;
    }
  }
};

/**
 * Google OAuth Service
 * Handles Google Sign-In integration for authentication
 */

import { API_ENDPOINTS, buildApiUrl } from '../config/api';

// Google Sign-In API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface GoogleAuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  isNewUser: boolean;
  suggestedNickname?: string;
}

// Declare google global from the loaded script
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          revoke: (email: string, callback: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

export class GoogleAuthService {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Load and initialize Google Sign-In SDK
   */
  static async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized && window.google) {
      return Promise.resolve();
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      // Check if the script is already loaded
      if (window.google?.accounts) {
        this.isInitialized = true;
        resolve();
        return;
      }

      // Load the Google Sign-In script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isInitialized = true;
        resolve();
      };

      script.onerror = () => {
        this.initializationPromise = null;
        reject(new Error('Failed to load Google Sign-In SDK'));
      };

      document.head.appendChild(script);
    });

    return this.initializationPromise;
  }

  /**
   * Sign in with Google using popup
   */
  static async signInWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      // Ensure SDK is loaded
      await this.initialize();

      if (!window.google) {
        throw new Error('Google SDK not loaded');
      }

      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env');
      }

      // Get ID Token using One Tap or Token Client
      const idToken = await this.getGoogleIdToken();

      // Send token to backend for verification
      const response = await this.sendTokenToBackend(idToken);

      return response;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Get Google ID Token using credential flow
   */
  private static async getGoogleIdToken(): Promise<string> {
    // Use the credential flow with popup for better security
    return this.getCredentialWithPopup();
  }

  /**
   * Get Google credential using popup (using OAuth2 token client)
   */
  private static async getCredentialWithPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google SDK not initialized'));
        return;
      }

      try {
        // Use OAuth2 token client instead of One Tap for better compatibility
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID!,
          scope: 'openid email profile',
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(`Google OAuth error: ${response.error}`));
              return;
            }

            if (response.access_token) {
              // Send access token directly - backend will verify it with Google
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google'));
            }
          },
        });

        // Request an access token
        client.requestAccessToken();
      } catch (error) {
        reject(new Error('Failed to initialize Google OAuth client'));
      }
    });
  }

  /**
   * Send Google ID token to backend for verification and authentication
   */
  private static async sendTokenToBackend(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.AUTH_GOOGLE);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      return data.data as GoogleAuthResponse;
    } catch (error) {
      console.error('Error sending token to backend:', error);
      throw error;
    }
  }

  /**
   * Sign out (revoke Google access)
   */
  static async signOut(email: string): Promise<void> {
    if (!this.isInitialized || !window.google) {
      return;
    }

    return new Promise(resolve => {
      window.google!.accounts.id.revoke(email, () => {
        window.google!.accounts.id.disableAutoSelect();
        resolve();
      });
    });
  }
}

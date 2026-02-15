import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { ApiResponse } from '../types/common';

// Helper function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthController {
  /**
   * Verifies Google token (ID token or access token) and extracts user information
   */
  private static async verifyGoogleToken(token: string) {
    try {
      // First, try to verify as an ID token (JWT)
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (payload) {
          return {
            email: payload.email!,
            name: payload.name || '',
            picture: payload.picture || '',
            emailVerified: payload.email_verified || false,
            googleId: payload.sub,
          };
        }
      } catch (idTokenError) {
        // Not an ID token, try as access token
        logger.info('Token is not an ID token, trying as access token');
      }

      // If ID token verification failed, try using it as an access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userData = (await userInfoResponse.json()) as {
        email: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
        sub: string;
      };

      if (!userData.email) {
        throw new Error('No email in Google user data');
      }

      return {
        email: userData.email,
        name: userData.name || '',
        picture: userData.picture || '',
        emailVerified: userData.email_verified || false,
        googleId: userData.sub,
      };
    } catch (error) {
      logger.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Generates suggested nickname from email
   */
  private static generateNicknameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  /**
   * POST /api/auth/google
   * Handles Google OAuth authentication
   */
  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({
          success: false,
          error: 'ID Token required',
          message: 'Google ID token is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Verify Google token
      const googleUser = await GoogleAuthController.verifyGoogleToken(idToken);
      logger.info('Google user verified:', { email: googleUser.email });

      // Check if user exists in Supabase Auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === googleUser.email);

      let userId: string;
      let isNewUser = false;
      let session: any;

      if (existingUser) {
        // User exists - link OAuth provider if not already linked
        logger.info('Existing user found:', existingUser.id);
        userId = existingUser.id;

        // Update user metadata to include Google info if not present
        if (!existingUser.user_metadata?.oauth_provider) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...existingUser.user_metadata,
              oauth_provider: 'google',
              google_id: googleUser.googleId,
            },
          });
        }

        // For existing OAuth users, we need to create a session
        // Since we don't know their original password, we'll update it temporarily
        const tempPassword = `google_oauth_${googleUser.googleId}_${Date.now()}`;

        // Update user password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });

        if (updateError) {
          logger.error('Error updating user password:', updateError);
          throw new Error('Failed to update user credentials');
        }

        // Now sign in with the new password to get a valid session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: googleUser.email,
          password: tempPassword,
        });

        if (signInError || !signInData.session) {
          logger.error('Error signing in existing user:', signInError);
          throw new Error('Failed to create session for existing user');
        }

        session = signInData.session;
        logger.info('Session created successfully for existing user');
      } else {
        // New user - create account
        logger.info('Creating new user with Google OAuth');
        isNewUser = true;

        const suggestedNickname = GoogleAuthController.generateNicknameFromEmail(googleUser.email);

        // Create user in Supabase Auth with a random password
        // (since OAuth users don't use password login)
        const randomPassword = `google_${googleUser.googleId}_${Date.now()}`;

        const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
          email: googleUser.email,
          password: randomPassword,
          options: {
            data: {
              nickname: suggestedNickname,
              full_name: googleUser.name,
              avatar_url: googleUser.picture,
              oauth_provider: 'google',
              google_id: googleUser.googleId,
              email_confirmed: googleUser.emailVerified,
            },
            emailRedirectTo: undefined, // Don't send confirmation email for OAuth users
          },
        });

        if (signUpError || !newUserData.user) {
          logger.error('Error creating user:', signUpError);
          res.status(400).json({
            success: false,
            error: 'Error creating user',
            message: getErrorMessage(signUpError),
            timestamp: new Date().toISOString(),
          } as ApiResponse);
          return;
        }

        userId = newUserData.user.id;
        session = newUserData.session;

        // Create user profile
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: userId,
          email: googleUser.email,
          nickname: suggestedNickname,
          full_name: googleUser.name || null,
          avatar_url: googleUser.picture || null,
          role: 'player', // OAuth users are always players
          oauth_provider: 'google',
        });

        if (profileError) {
          logger.error('Error creating user profile:', profileError);
          // Don't fail the request, profile can be created later
        }

        // Auto-login the user if session is not available
        if (!session?.access_token) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: googleUser.email,
            password: randomPassword,
          });

          if (!loginError && loginData.session) {
            session = loginData.session;
          }
        }
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      res.status(200).json({
        success: true,
        data: {
          user: profile || {
            id: userId,
            email: googleUser.email,
            nickname: GoogleAuthController.generateNicknameFromEmail(googleUser.email),
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
          },
          session: {
            access_token: session?.access_token,
            refresh_token: session?.refresh_token,
            expires_at: session?.expires_at,
          },
          isNewUser,
          suggestedNickname: isNewUser
            ? GoogleAuthController.generateNicknameFromEmail(googleUser.email)
            : undefined,
        },
        message: isNewUser
          ? 'Usuario registrado exitosamente con Google'
          : 'Inicio de sesión exitoso con Google',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in Google OAuth:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}

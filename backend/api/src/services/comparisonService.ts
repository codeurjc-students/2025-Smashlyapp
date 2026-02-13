import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { RacketComparisonData } from './openRouterService';

export interface Comparison {
  id: string;
  user_id: string;
  racket_ids: number[];
  comparison_text: string;
  metrics?: RacketComparisonData[];
  share_token?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateComparisonDto {
  user_id: string;
  racket_ids: number[];
  comparison_text: string;
  metrics?: RacketComparisonData[];
}

export class ComparisonService {
  /**
   * Save a new comparison
   */
  static async createComparison(data: CreateComparisonDto): Promise<Comparison> {
    try {
      const insertData: any = {
        user_id: data.user_id,
        racket_ids: data.racket_ids,
        comparison_text: data.comparison_text,
      };

      // Add metrics if provided
      if (data.metrics && data.metrics.length > 0) {
        insertData.metrics = data.metrics;
      }

      const { data: comparison, error } = await supabase
        .from('comparisons')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating comparison:', error);
        throw new Error(error.message);
      }

      return comparison as Comparison;
    } catch (error: any) {
      logger.error('Error in createComparison service:', error);
      throw error;
    }
  }

  /**
   * Get all comparisons for a user
   */
  static async getUserComparisons(userId: string): Promise<Comparison[]> {
    try {
      const { data: comparisons, error } = await supabase
        .from('comparisons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user comparisons:', error);
        throw new Error(error.message);
      }

      return comparisons as Comparison[];
    } catch (error: any) {
      logger.error('Error in getUserComparisons service:', error);
      throw error;
    }
  }

  /**
   * Get a specific comparison by ID
   */
  static async getComparisonById(id: string, userId: string): Promise<Comparison | null> {
    try {
      const { data: comparison, error } = await supabase
        .from('comparisons')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Error fetching comparison by ID:', error);
        throw new Error(error.message);
      }

      return comparison as Comparison;
    } catch (error: any) {
      logger.error('Error in getComparisonById service:', error);
      throw error;
    }
  }

  /**
   * Delete a comparison
   */
  static async deleteComparison(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comparisons')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting comparison:', error);
        throw new Error(error.message);
      }

      return true;
    } catch (error: any) {
      logger.error('Error in deleteComparison service:', error);
      throw error;
    }
  }

  /**
   * Get comparison count for a user
   */
  static async getUserComparisonCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comparisons')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logger.error('Error counting user comparisons:', error);
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error: any) {
      logger.error('Error in getUserComparisonCount service:', error);
      throw error;
    }
  }

  /**
   * Generate a unique share token
   */
  private static generateShareToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Make a comparison public and generate share link
   */
  static async shareComparison(id: string, userId: string): Promise<string> {
    try {
      // Generate unique token
      const shareToken = this.generateShareToken();

      const { data, error } = await supabase
        .from('comparisons')
        .update({
          share_token: shareToken,
          is_public: true,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error sharing comparison:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Comparison not found or unauthorized');
      }

      return shareToken;
    } catch (error: any) {
      logger.error('Error in shareComparison service:', error);
      throw error;
    }
  }

  /**
   * Get public comparison by share token
   */
  static async getSharedComparison(shareToken: string): Promise<Comparison | null> {
    try {
      const { data: comparison, error } = await supabase
        .from('comparisons')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching shared comparison:', error);
        throw new Error(error.message);
      }

      return comparison as Comparison;
    } catch (error: any) {
      logger.error('Error in getSharedComparison service:', error);
      throw error;
    }
  }

  /**
   * Unshare a comparison (make it private)
   */
  static async unshareComparison(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comparisons')
        .update({
          is_public: false,
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error unsharing comparison:', error);
        throw new Error(error.message);
      }

      return true;
    } catch (error: any) {
      logger.error('Error in unshareComparison service:', error);
      throw error;
    }
  }
}

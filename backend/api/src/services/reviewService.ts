/**
 * Review Service
 * Handles all business logic related to racket reviews
 */

import { supabase } from "../config/supabase";
import {
  Review,
  ReviewWithDetails,
  CreateReviewDTO,
  UpdateReviewDTO,
  CreateCommentDTO,
  ReviewFilters,
  ReviewsResponse,
  ReviewComment,
} from "../types/review";

export class ReviewService {
  /**
   * Construye la query base para obtener reviews
   */
  private static buildReviewsQuery(racketId: number) {
    return supabase
      .from("reviews")
      .select(
        `
        *,
        user:user_profiles!reviews_user_id_fkey (
          id,
          nickname,
          avatar_url
        ),
        racket:rackets!reviews_racket_id_fkey (
          id,
          name,
          brand,
          model,
          image
        )
      `,
        { count: "exact" }
      )
      .eq("racket_id", racketId);
  }

  /**
   * Aplica filtros y ordenamiento a la query de reviews
   */
  private static applyReviewFilters(query: ReturnType<typeof ReviewService.buildReviewsQuery>, filters: ReviewFilters) {
    const { rating, sort = "recent" } = filters;

    // Aplicar filtro de rating si existe
    if (rating) {
      query = query.eq("rating", rating);
    }

    // Aplicar ordenamiento
    switch (sort) {
      case "rating_high":
        query = query.order("rating", { ascending: false });
        break;
      case "rating_low":
        query = query.order("rating", { ascending: true });
        break;
      case "most_liked":
        query = query.order("likes_count", { ascending: false });
        break;
      case "recent":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    return query;
  }

  /**
   * Adds user like information to reviews
   */
  private static async addUserLikesInfo(
    reviews: any[],
    userId?: string
  ): Promise<ReviewWithDetails[]> {
    if (!reviews) return [];

    if (userId) {
      const reviewIds = reviews.map((r) => r.id);
      const { data: userLikes } = await supabase
        .from("review_likes")
        .select("review_id")
        .eq("user_id", userId)
        .in("review_id", reviewIds);

      const likedReviewIds = new Set(userLikes?.map((l) => l.review_id) || []);

      return reviews.map((review) => ({
        ...review,
        user_has_liked: likedReviewIds.has(review.id),
      }));
    }

    return reviews.map((review) => ({
      ...review,
      user_has_liked: false,
    }));
  }

  /**
   * Get reviews for a racket with pagination and filters
   */
  static async getReviewsByRacket(
    racketId: number,
    filters: ReviewFilters = {},
    userId?: string
  ): Promise<ReviewsResponse> {
    const { page = 1, limit = 5 } = filters;
    const offset = (page - 1) * limit;

    // Build and configure query
    let query = this.buildReviewsQuery(racketId);
    query = this.applyReviewFilters(query, filters);
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    // Add user like information
    const reviewsWithDetails = await this.addUserLikesInfo(reviews, userId);

    // Get statistics
    const { data: statsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("racket_id", racketId);

    const stats = this.calculateStats(statsData || []);

    return {
      reviews: reviewsWithDetails,
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
      stats,
    };
  }

  /**
   * Get reviews from a user
   */
  static async getReviewsByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewsResponse> {
    const offset = (page - 1) * limit;

    const {
      data: reviews,
      error,
      count,
    } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:user_profiles!reviews_user_id_fkey (
          id,
          nickname,
          avatar_url
        ),
        racket:rackets!reviews_racket_id_fkey (
          id,
          name,
          brand,
          model,
          image
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      reviews: (reviews || []) as ReviewWithDetails[],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Obtiene los comentarios de una review
   */
  private static async getReviewComments(reviewId: string) {
    const { data: comments } = await supabase
      .from("review_comments")
      .select(
        `
        *,
        user:user_profiles!review_comments_user_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    return comments || [];
  }

  /**
   * Verifica si un usuario ha dado like a una review
   */
  private static async checkUserLike(reviewId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;

    const { data: like } = await supabase
      .from("review_likes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single();

    return !!like;
  }

  /**
   * Get a specific review with all its details
   */
  static async getReviewById(
    reviewId: string,
    userId?: string
  ): Promise<ReviewWithDetails | null> {
    const { data: review, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:user_profiles!reviews_user_id_fkey (
          id,
          nickname,
          avatar_url
        ),
        racket:rackets!reviews_racket_id_fkey (
          id,
          name,
          brand,
          model,
          image
        )
      `
      )
      .eq("id", reviewId)
      .single();

    if (error || !review) return null;

    // Obtener comentarios y verificar like del usuario en paralelo
    const [comments, userHasLiked] = await Promise.all([
      this.getReviewComments(reviewId),
      this.checkUserLike(reviewId, userId),
    ]);

    return {
      ...review,
      comments,
      user_has_liked: userHasLiked,
    };
  }

  /**
   * Crear una nueva review
   */
  static async createReview(
    userId: string,
    reviewData: CreateReviewDTO
  ): Promise<Review> {
    // Verificar que el usuario no tenga ya una review para esta pala
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("racket_id", reviewData.racket_id)
      .single();

    if (existing) {
      throw new Error("Ya has publicado una review para esta pala");
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        ...reviewData,
      })
      .select()
      .single();

    if (error) throw error;

    return review;
  }

  /**
   * Actualizar una review existente
   */
  static async updateReview(
    reviewId: string,
    userId: string,
    updates: UpdateReviewDTO
  ): Promise<Review> {
    // Verificar que la review pertenece al usuario
    const { data: existing } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("No tienes permiso para editar esta review");
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;

    return review;
  }

  /**
   * Eliminar una review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    // Verificar que la review pertenece al usuario
    const { data: existing } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("No tienes permiso para eliminar esta review");
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;
  }

  /**
   * Dar/quitar like a una review
   */
  static async toggleLike(reviewId: string, userId: string): Promise<boolean> {
    // Verificar si ya existe el like
    const { data: existing } = await supabase
      .from("review_likes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Quitar like
      const { error } = await supabase
        .from("review_likes")
        .delete()
        .eq("id", existing.id);

      if (error) throw error;
      return false; // Se quitó el like
    } else {
      // Dar like
      const { error } = await supabase.from("review_likes").insert({
        review_id: reviewId,
        user_id: userId,
      });

      if (error) throw error;
      return true; // Se dio like
    }
  }

  /**
   * Agregar un comentario a una review
   */
  static async addComment(
    reviewId: string,
    userId: string,
    commentData: CreateCommentDTO
  ): Promise<ReviewComment> {
    const { data: comment, error } = await supabase
      .from("review_comments")
      .insert({
        review_id: reviewId,
        user_id: userId,
        content: commentData.content,
      })
      .select(
        `
        *,
        user:user_profiles!review_comments_user_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `
      )
      .single();

    if (error) throw error;

    return comment as ReviewComment;
  }

  /**
   * Obtener comentarios de una review
   */
  static async getComments(reviewId: string): Promise<ReviewComment[]> {
    const { data: comments, error } = await supabase
      .from("review_comments")
      .select(
        `
        *,
        user:user_profiles!review_comments_user_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (comments || []) as ReviewComment[];
  }

  /**
   * Eliminar un comentario
   */
  static async deleteComment(commentId: string, userId: string): Promise<void> {
    // Verificar que el comentario pertenece al usuario
    const { data: existing } = await supabase
      .from("review_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("No tienes permiso para eliminar este comentario");
    }

    const { error } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;
  }

  /**
   * Calcular estadísticas de reviews
   */
  private static calculateStats(reviews: { rating: number }[]) {
    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return {
      average_rating: Math.round(averageRating * 10) / 10,
      total_reviews: reviews.length,
      rating_distribution: distribution,
    };
  }
}

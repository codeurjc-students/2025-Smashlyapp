/**
 * Sistema de Reviews - Tipos TypeScript para el Frontend
 */

export interface Review {
  id: string;
  user_id: string;
  racket_id: number;
  title: string;
  content: string;
  rating: number; // 1-5
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
}

export interface ReviewWithUser extends Review {
  user: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

export interface ReviewWithDetails extends ReviewWithUser {
  racket: {
    id: number;
    nombre: string;
    marca: string;
    modelo: string;
    imagen?: string;
  };
  user_has_liked?: boolean;
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

export interface CreateReviewDTO {
  racket_id: number;
  title: string;
  content: string;
  rating: number;
}

export interface UpdateReviewDTO {
  title?: string;
  content?: string;
  rating?: number;
}

export interface CreateCommentDTO {
  content: string;
}

export interface ReviewFilters {
  rating?: number;
  sort?: "recent" | "rating_high" | "rating_low" | "most_liked";
  page?: number;
  limit?: number;
}

export interface ReviewsResponse {
  reviews: ReviewWithUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

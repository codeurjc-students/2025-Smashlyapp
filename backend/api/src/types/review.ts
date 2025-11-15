/**
 * Sistema de Reviews - Tipos TypeScript
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
    nombre: string;  // Mapeado desde 'name' en DB
    marca: string;   // Mapeado desde 'brand' en DB
    modelo: string;  // Mapeado desde 'model' en DB
    imagen?: string; // Mapeado desde 'image' en DB
  };
  user_has_liked?: boolean; // If the current user has liked
  comments?: ReviewComment[];
}

export interface ReviewLike {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
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
  rating?: number; // Filtrar por rating específico
  sort?: "recent" | "rating_high" | "rating_low" | "most_liked"; // Ordenamiento
  page?: number;
  limit?: number;
}

export interface ReviewsResponse {
  reviews: ReviewWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  stats?: {
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
      [key: number]: number; // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
    };
  };
}

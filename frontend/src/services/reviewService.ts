/**
 * Review Service
 * Servicio para gestionar reviews de palas
 */

import { API_URL } from "../config/api";
import type {
  Review,
  ReviewWithDetails,
  CreateReviewDTO,
  UpdateReviewDTO,
  CreateCommentDTO,
  ReviewsResponse,
  ReviewComment,
} from "../types/review";

// Helper para obtener el token de autenticación
const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// Helper para hacer peticiones con autenticación
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Error desconocido" }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
};

export const reviewService = {
  /**
   * Obtener reviews de una pala específica
   */
  async getReviewsByRacket(
    racketId: number,
    params?: {
      rating?: number;
      sort?: "recent" | "rating_high" | "rating_low" | "most_liked";
      page?: number;
      limit?: number;
    }
  ): Promise<ReviewsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.rating) queryParams.append("rating", params.rating.toString());
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/api/v1/reviews/rackets/${racketId}${
      queryString ? `?${queryString}` : ""
    }`;

    return fetchWithAuth(url);
  },

  /**
   * Obtener reviews de un usuario
   */
  async getReviewsByUser(
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ReviewsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/api/v1/reviews/users/${userId}${
      queryString ? `?${queryString}` : ""
    }`;

    return fetchWithAuth(url);
  },

  /**
   * Obtener una review específica
   */
  async getReviewById(reviewId: string): Promise<ReviewWithDetails> {
    return fetchWithAuth(`/api/v1/reviews/${reviewId}`);
  },

  /**
   * Crear una nueva review
   */
  async createReview(data: CreateReviewDTO): Promise<Review> {
    return fetchWithAuth("/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una review existente
   */
  async updateReview(reviewId: string, data: UpdateReviewDTO): Promise<Review> {
    return fetchWithAuth(`/api/v1/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar una review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await fetchWithAuth(`/api/v1/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },

  /**
   * Dar/quitar like a una review (toggle)
   */
  async toggleLike(
    reviewId: string
  ): Promise<{ liked: boolean; likes_count: number }> {
    return fetchWithAuth(`/api/v1/reviews/${reviewId}/like`, {
      method: "POST",
    });
  },

  /**
   * Obtener comentarios de una review
   */
  async getComments(reviewId: string): Promise<ReviewComment[]> {
    return fetchWithAuth(`/api/v1/reviews/${reviewId}/comments`);
  },

  /**
   * Agregar un comentario a una review
   */
  async addComment(
    reviewId: string,
    data: CreateCommentDTO
  ): Promise<ReviewComment> {
    return fetchWithAuth(`/api/v1/reviews/${reviewId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar un comentario
   */
  async deleteComment(commentId: string): Promise<void> {
    await fetchWithAuth(`/api/v1/reviews/comments/${commentId}`, {
      method: "DELETE",
    });
  },
};

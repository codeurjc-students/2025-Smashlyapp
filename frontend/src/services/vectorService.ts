import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

// Vector embeddings service for RAG implementation using Gemini
export interface VectorEmbedding {
  id: string;
  content: string;
  metadata: any;
  embedding: number[];
  created_at: string;
}

export interface UserInteraction {
  user_id: string;
  racket_id: number;
  interaction_type: 'view' | 'compare' | 'recommend' | 'purchase_intent';
  rating?: number; // 1-5 stars if user provides feedback
  context: {
    user_profile: any;
    session_data: any;
  };
  timestamp: string;
}

export interface SimilarityResult {
  racket: any;
  similarity_score: number;
  reasons: string[];
}

export class VectorService {
  private supabase;
  private genAI: GoogleGenerativeAI | null;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Usar la misma API key de Gemini que ya tienes configurada
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

    if (!this.genAI) {
      console.warn('⚠️ Gemini API key no encontrada. Embeddings no estarán disponibles.');
    }
  }

  /**
   * Generate embeddings for racket data using Gemini
   */
  async generateRacketEmbedding(racket: any): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Gemini AI no está configurado. Verifica tu API key.');
    }

    // Create rich text representation of racket
    const racketText = `
      Pala de pádel: ${racket.nombre}
      Marca: ${racket.marca}
      Modelo: ${racket.modelo}
      Precio: ${racket.precio_actual}€
      ${racket.precio_original ? `Precio original: ${racket.precio_original}€` : ''}
      ${racket.descuento_porcentaje > 0 ? `Descuento: ${racket.descuento_porcentaje}%` : ''}
      Bestseller: ${racket.es_bestseller ? 'Sí' : 'No'}
      En oferta: ${racket.en_oferta ? 'Sí' : 'No'}
      Fuente: ${racket.fuente}
      Características para recomendación de pádel
    `.trim();

    try {
      // Usar el modelo de embeddings de Gemini
      const model = this.genAI.getGenerativeModel({ 
        model: "text-embedding-004"  // Modelo de embeddings de Gemini
      });
      
      const result = await model.embedContent(racketText);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No se pudo generar embedding para la pala');
      }

      return result.embedding.values;
    } catch (error) {
      console.error('Error generating racket embedding with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for user profile using Gemini
   */
  async generateUserEmbedding(userProfile: any): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Gemini AI no está configurado. Verifica tu API key.');
    }

    const userText = `
      Perfil de jugador de pádel:
      Nivel de juego: ${userProfile.nivel_juego || 'No especificado'}
      Peso: ${userProfile.peso || 'No especificado'}kg
      Altura: ${userProfile.altura || 'No especificado'}cm
      Limitaciones físicas: ${userProfile.limitaciones || 'Ninguna'}
      Email: ${userProfile.email || ''}
      Nickname: ${userProfile.nickname || ''}
      Perfil para recomendación personalizada de palas de pádel
    `.trim();

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: "text-embedding-004" 
      });
      
      const result = await model.embedContent(userText);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No se pudo generar embedding para el usuario');
      }

      return result.embedding.values;
    } catch (error) {
      console.error('Error generating user embedding with Gemini:', error);
      throw error;
    }
  }

  /**
   * Store user interaction for learning
   */
  async storeUserInteraction(interaction: UserInteraction): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_interactions')
        .insert([interaction]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing user interaction:', error);
      throw error;
    }
  }

  /**
   * Find similar users based on profile and interactions
   */
  async findSimilarUsers(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get user's embedding
      const userProfile = await this.getUserProfile(userId);
      const userEmbedding = await this.generateUserEmbedding(userProfile);

      // Use Supabase vector similarity search (requires pgvector extension)
      const { data, error } = await this.supabase
        .rpc('match_similar_users', {
          query_embedding: userEmbedding,
          match_threshold: 0.7,
          match_count: limit,
          exclude_user_id: userId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get racket recommendations based on similar users
   */
  async getCollaborativeRecommendations(userId: string): Promise<SimilarityResult[]> {
    try {
      const similarUsers = await this.findSimilarUsers(userId);
      
      // Get rackets that similar users liked/purchased
      const { data: interactions, error } = await this.supabase
        .from('user_interactions')
        .select(`
          racket_id,
          rating,
          palas_padel!inner(*)
        `)
        .in('user_id', similarUsers.map(u => u.user_id))
        .in('interaction_type', ['recommend', 'purchase_intent'])
        .gte('rating', 4); // Only high-rated interactions

      if (error) throw error;

      // Calculate recommendation scores
      const racketScores = new Map();
      interactions?.forEach(interaction => {
        const racketId = interaction.racket_id;
        const currentScore = racketScores.get(racketId) || 0;
        racketScores.set(racketId, currentScore + (interaction.rating || 3));
      });

      // Convert to similarity results
      const results: SimilarityResult[] = Array.from(racketScores.entries())
        .map(([racketId, score]) => {
          const racket = interactions?.find(i => i.racket_id === racketId)?.palas_padel;
          return {
            racket,
            similarity_score: score / similarUsers.length,
            reasons: ['Usuarios similares a ti valoraron positivamente esta pala']
          };
        })
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 10);

      return results;
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Content-based filtering using vector similarity
   */
  async getContentBasedRecommendations(
    userProfile: any, 
    preferredRackets: any[] = []
  ): Promise<SimilarityResult[]> {
    try {
      if (preferredRackets.length === 0) {
        return [];
      }

      // Generate average embedding from preferred rackets
      const preferredEmbeddings = await Promise.all(
        preferredRackets.map(racket => this.generateRacketEmbedding(racket))
      );

      // Calculate average embedding
      const avgEmbedding = preferredEmbeddings[0].map((_, i) =>
        preferredEmbeddings.reduce((sum, emb) => sum + emb[i], 0) / preferredEmbeddings.length
      );

      // Find similar rackets using vector similarity
      const { data, error } = await this.supabase
        .rpc('match_similar_rackets', {
          query_embedding: avgEmbedding,
          match_threshold: 0.75,
          match_count: 15
        });

      if (error) throw error;

      return data?.map((item: any) => ({
        racket: item.racket_data,
        similarity_score: item.similarity,
        reasons: [`Similar a palas que te han gustado: ${preferredRackets.map(r => r.nombre).join(', ')}`]
      })) || [];

    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  private async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

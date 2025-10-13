import { GoogleGenerativeAI } from "@google/generative-ai";
import { FormData, MultipleRacketRecommendations, Racket } from "../types/racket";
import { SimilarityResult, VectorService } from "./vectorService";

// Enhanced RAG service that combines vector search with Gemini AI
export class RAGRecommendationService {
  private vectorService: VectorService;
  private genAI: GoogleGenerativeAI | null;

  constructor() {
    this.vectorService = new VectorService();
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Enhanced recommendation system using RAG approach
   */
  async getEnhancedRecommendations(
    formData: FormData,
    racketDatabase: Racket[],
    userId?: string
  ): Promise<MultipleRacketRecommendations> {
    try {
      // Step 1: Get user context and similar users
      let collaborativeRecs: SimilarityResult[] = [];
      let contentBasedRecs: SimilarityResult[] = [];
      let userInteractionHistory: any[] = [];

      if (userId) {
        // Get collaborative filtering recommendations
        collaborativeRecs = await this.vectorService.getCollaborativeRecommendations(userId);
        
        // Get user's interaction history
        userInteractionHistory = await this.getUserInteractionHistory(userId);
        
        // Get content-based recommendations if user has preferences
        const preferredRackets = this.extractPreferredRackets(userInteractionHistory);
        if (preferredRackets.length > 0) {
          contentBasedRecs = await this.vectorService.getContentBasedRecommendations(
            formData, 
            preferredRackets
          );
        }
      }

      // Step 2: Create enhanced context for Gemini
      const enhancedContext = this.buildEnhancedContext({
        formData,
        collaborativeRecs,
        contentBasedRecs,
        userInteractionHistory,
        racketDatabase
      });

      // Step 3: Get Gemini recommendations with RAG context
      const geminiRecommendations = await this.getGeminiWithRAGContext(
        enhancedContext,
        racketDatabase
      );

      // Step 4: Store interaction for future learning
      if (userId) {
        await this.storeRecommendationInteraction(userId, geminiRecommendations, formData);
      }

      return geminiRecommendations;

    } catch (error) {
      console.error('Error in RAG recommendation service:', error);
      // Fallback to original Gemini approach
      return this.fallbackToOriginalGemini(formData, racketDatabase);
    }
  }

  /**
   * Build enhanced context combining user data with RAG insights
   */
  private buildEnhancedContext(data: {
    formData: FormData;
    collaborativeRecs: SimilarityResult[];
    contentBasedRecs: SimilarityResult[];
    userInteractionHistory: any[];
    racketDatabase: Racket[];
  }): string {
    const { formData, collaborativeRecs, contentBasedRecs, userInteractionHistory } = data;

    let context = `
PERFIL BASE DEL USUARIO:
- Nivel de juego: ${formData.gameLevel}
- Estilo de juego: ${formData.playingStyle}
- Peso corporal: ${formData.weight} kg
- Altura: ${formData.height} cm
- Presupuesto máximo: €${formData.budget}
- Forma preferida: ${formData.preferredShape || "Sin preferencia"}
`;

    // Add collaborative filtering insights
    if (collaborativeRecs.length > 0) {
      context += `

INSIGHTS DE USUARIOS SIMILARES:
Los usuarios con perfil similar al tuyo han valorado positivamente estas palas:
${collaborativeRecs.slice(0, 5).map(rec => 
  `- ${rec.racket.nombre} (Puntuación de similitud: ${(rec.similarity_score * 100).toFixed(1)}%)`
).join('\n')}
`;
    }

    // Add content-based insights
    if (contentBasedRecs.length > 0) {
      context += `

RECOMENDACIONES BASADAS EN TUS PREFERENCIAS PASADAS:
Basado en palas que has mostrado interés anteriormente:
${contentBasedRecs.slice(0, 3).map(rec => 
  `- ${rec.racket.nombre} - ${rec.reasons.join(', ')}`
).join('\n')}
`;
    }

    // Add interaction history insights
    if (userInteractionHistory.length > 0) {
      const recentInteractions = userInteractionHistory.slice(0, 5);
      context += `

HISTORIAL DE INTERACCIONES RECIENTES:
${recentInteractions.map(interaction => {
        const action = this.getActionDescription(interaction.interaction_type);
        return `- ${action}: ${interaction.racket_name || 'Pala no identificada'} ${interaction.rating ? `(Valoración: ${interaction.rating}/5)` : ''}`;
      }).join('\n')}
`;
    }

    context += `

INSTRUCCIONES MEJORADAS:
1. Considera PRIORITARIAMENTE las insights de usuarios similares y las preferencias pasadas
2. Si hay conflictos entre el perfil base y las preferencias mostradas, prioriza las preferencias demostradas
3. Explica cómo cada recomendación se relaciona con los patrones identificados
4. Si el usuario ha mostrado interés en marcas específicas, considera eso en las recomendaciones
`;

    return context;
  }

  /**
   * Get Gemini recommendations with enhanced RAG context
   */
  private async getGeminiWithRAGContext(
    enhancedContext: string,
    racketDatabase: Racket[]
  ): Promise<MultipleRacketRecommendations> {
    if (!this.genAI) {
      throw new Error("Gemini AI no está configurado");
    }

    // Filter rackets based on budget and availability
    const availableRackets = racketDatabase.filter(racket => 
      parseFloat(racket.precio_actual.toString()) <= parseFloat(enhancedContext.match(/€(\d+)/)?.[1] || '1000')
    );

    const racketsList = availableRackets
      .slice(0, 100) // Increased limit due to better context
      .map(racket => 
        `${racket.nombre} - ${racket.marca} ${racket.modelo} - €${racket.precio_actual}${
          racket.en_oferta ? " (En oferta)" : ""
        }${racket.es_bestseller ? " (Bestseller)" : ""}`
      ).join("\n");

    const prompt = `
${enhancedContext}

BASE DE DATOS DE PALAS DISPONIBLES:
${racketsList}

Basándote en el perfil del usuario Y especialmente en los insights de usuarios similares y preferencias pasadas, 
proporciona exactamente 3 recomendaciones personalizadas que consideren:

1. Las palas valoradas por usuarios similares
2. Los patrones de interacción del usuario
3. El perfil base declarado
4. La disponibilidad y presupuesto

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "recommendations": [
    {
      "racketName": "Nombre exacto de la pala",
      "brand": "Marca",
      "model": "Modelo", 
      "price": "€XXX",
      "imageUrl": "",
      "whyThisRacket": "Explicación que incluya cómo se relaciona con usuarios similares y/o preferencias pasadas (200 palabras)",
      "technicalSpecs": {
        "weight": "XXX-XXX gramos",
        "balance": "Medio/Alto/Bajo",
        "shape": "Redonda/Lágrima/Diamante",
        "material": "Material principal",
        "level": "Nivel recomendado"
      },
      "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
      "cons": ["Consideración 1", "Consideración 2"],
      "matchPercentage": 95,
      "ragInsights": "Cómo esta recomendación se basa en datos de usuarios similares o preferencias pasadas"
    }
  ],
  "summary": "Resumen que explique cómo las recomendaciones consideran tanto el perfil como los insights de RAG (150 palabras)"
}
`;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
      const recommendations: MultipleRacketRecommendations = JSON.parse(cleanedText);

      // Validate and enhance with actual racket data
      return this.enhanceRecommendationsWithActualData(recommendations, availableRackets);

    } catch (error) {
      console.error('Error with Gemini RAG recommendations:', error);
      throw error;
    }
  }

  /**
   * Store recommendation interaction for future learning
   */
  private async storeRecommendationInteraction(
    userId: string,
    recommendations: MultipleRacketRecommendations,
    formData: FormData
  ): Promise<void> {
    try {
      for (const rec of recommendations.recommendations) {
        await this.vectorService.storeUserInteraction({
          user_id: userId,
          racket_id: this.findRacketIdByName(rec.racketName),
          interaction_type: 'recommend',
          context: {
            user_profile: formData,
            session_data: {
              timestamp: new Date().toISOString(),
              match_percentage: rec.matchPercentage
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error storing recommendation interaction:', error);
    }
  }

  /**
   * Get user interaction history
   */
  private async getUserInteractionHistory(userId: string): Promise<any[]> {
    // This would query your database for user interactions
    // Implementation depends on your database schema
    try {
      // Placeholder - implement based on your database structure
      return [];
    } catch (error) {
      console.error('Error getting user interaction history:', error);
      return [];
    }
  }

  /**
   * Extract preferred rackets from interaction history
   */
  private extractPreferredRackets(interactions: any[]): Racket[] {
    // Extract rackets that user has shown positive interest in
    return interactions
      .filter(interaction => 
        interaction.rating >= 4 || 
        interaction.interaction_type === 'purchase_intent'
      )
      .map(interaction => interaction.racket)
      .filter(Boolean);
  }

  /**
   * Helper methods
   */
  private getActionDescription(type: string): string {
    const actions: { [key: string]: string } = {
      'view': 'Viste',
      'compare': 'Comparaste',
      'recommend': 'Recomendada para ti',
      'purchase_intent': 'Mostraste interés en comprar'
    };
    return actions[type] || 'Interactuaste con';
  }

  private findRacketIdByName(name: string): number {
    // Implementation to find racket ID by name
    // This should query your racket database
    return 0; // Placeholder
  }

  private enhanceRecommendationsWithActualData(
    recommendations: MultipleRacketRecommendations,
    racketDatabase: Racket[]
  ): MultipleRacketRecommendations {
    // Enhance recommendations with actual racket data
    recommendations.recommendations = recommendations.recommendations.map(rec => {
      const actualRacket = racketDatabase.find(r => 
        r.nombre.toLowerCase().includes(rec.racketName.toLowerCase()) ||
        rec.racketName.toLowerCase().includes(r.nombre.toLowerCase())
      );

      if (actualRacket) {
        rec.price = `€${actualRacket.precio_actual}`;
        rec.imageUrl = actualRacket.imagen;
      }

      return rec;
    });

    return recommendations;
  }

  /**
   * Fallback to original Gemini approach if RAG fails
   */
  private async fallbackToOriginalGemini(
    formData: FormData,
    racketDatabase: Racket[]
  ): Promise<MultipleRacketRecommendations> {
    // Import and use your original gemini function as fallback
    const { getRacketRecommendations } = await import('../utils/gemini');
    return getRacketRecommendations(formData, racketDatabase);
  }
}

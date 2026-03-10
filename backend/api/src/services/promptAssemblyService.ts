import { BasicFormData, AdvancedFormData } from '../types/recommendation';

export class PromptAssemblyService {
  /**
   * Construye el prompt RAG enriquecido con el contexto recuperado.
   */
  static buildRecommendationPrompt(context: {
    userProfile: BasicFormData | AdvancedFormData;
    retrievedRackets: Array<{
      racketId: number;
      content: string;
      similarity: number;
      metadata: Record<string, any>;
    }>;
    relevantReviews: Array<{
      racketId: number;
      content: string;
      metadata: Record<string, any>;
    }>;
    knowledgeContext: Array<{
      content: string;
      source: string;
    }>;
    safeRacketCount: number;
    totalCatalog: number;
  }): string {
    const {
      userProfile,
      retrievedRackets,
      relevantReviews,
      knowledgeContext,
      safeRacketCount,
      totalCatalog,
    } = context;

    const knowledgeSection =
      knowledgeContext.length > 0
        ? `CONOCIMIENTO DE DOMINIO RELEVANTE:\n---\n${knowledgeContext.map(k => k.content).join('\n---\n')}\n---\n`
        : '';

    const racketsSection = retrievedRackets
      .map((r, i) => {
        return `--- PALA ${i + 1} (Relevancia: ${(r.similarity * 100).toFixed(1)}%) ---\nID: ${r.racketId}\n${r.content}\n--- FIN PALA ${i + 1} ---`;
      })
      .join('\n\n');

    const reviewsSection =
      relevantReviews.length > 0
        ? `EXPERIENCIA DE LA COMUNIDAD (Reviews reales):\n${relevantReviews.map(rv => `- ${rv.content}`).join('\n')}`
        : 'No hay reviews disponibles para estas palas.';

    // Perfil formateado
    const profileSummary = `
- Nivel: ${userProfile.level}
- Lesiones: ${userProfile.injuries}
- Presupuesto: ${typeof userProfile.budget === 'object' ? `${userProfile.budget.min}-${userProfile.budget.max}€` : userProfile.budget}
- Tacto preferido: ${userProfile.touch_preference || 'No especificado'}
${'play_style' in userProfile ? `- Estilo de juego: ${userProfile.play_style}\n- Prioridades: ${userProfile.characteristic_priorities?.join(', ')}` : ''}
    `.trim();

    return `CONTEXTO DEL SISTEMA:
Eres "Smashly AI", un motor de recomendación experto en palas de pádel. Tu tarea es recomendar las 3 mejores palas basándote basándote EN LOS DATOS proporcionados.

${knowledgeSection}

PERFIL DEL USUARIO:
${profileSummary}

PALAS CANDIDATAS (Pre-filtradas por seguridad biomecánica):
De un catálogo de ${totalCatalog} palas, ${safeRacketCount} son seguras para este usuario.
Aquí tienes las ${retrievedRackets.length} más relevantes según su perfil:

${racketsSection}

${reviewsSection}

INSTRUCCIONES DE SALIDA:
1. Selecciona EXACTAMENTE 3 palas de las proporcionadas arriba.
2. Genera un JSON con la siguiente estructura:
{
  "rackets": [
    {
      "id": <id_de_la_pala>,
      "match_score": <puntuación_de_0_a_100>,
      "reason": "<explicación de por qué es ideal basándote en sus specs y reviews>",
      "priority_alignment": "<cómo encaja con sus prioridades de juego>",
      "biomechanical_fit": "<por qué es segura para sus lesiones o perfil físico>",
      "preference_match": "<cómo encaja con su preferencia de tacto/estética>"
    }
  ],
  "analysis": "<un resumen ejecutivo de por qué estas palas son las mejores para él, máx 150 palabras>"
}

IMPORTANTE: No inventes datos. Si no tienes reviews para una pala, no las menciones. No recomiendes palas que no estén en la lista de candidatos.

RESPONDE SOLO CON EL JSON.`;
  }
}

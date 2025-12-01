import { UserProfile } from '../services/userService';

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  suggestions: string[];
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(user: UserProfile | null): ProfileCompletionResult {
  if (!user) {
    return {
      percentage: 0,
      missingFields: [],
      suggestions: ['Inicia sesión para completar tu perfil'],
    };
  }

  const fields = {
    full_name: { weight: 10, label: 'Nombre completo' },
    email: { weight: 10, label: 'Email' },
    game_level: { weight: 15, label: 'Nivel de juego' },
    height: { weight: 10, label: 'Altura' },
    weight: { weight: 10, label: 'Peso' },
    birthdate: { weight: 10, label: 'Fecha de nacimiento' },
    city: { weight: 5, label: 'Ciudad' },
    limitations: { weight: 10, label: 'Limitaciones físicas' },
    nickname: { weight: 5, label: 'Apodo' },
    avatar_url: { weight: 5, label: 'Foto de perfil' },
  };

  let totalWeight = 0;
  let completedWeight = 0;
  const missingFields: string[] = [];

  Object.entries(fields).forEach(([key, config]) => {
    totalWeight += config.weight;
    const value = user[key as keyof UserProfile];
    
    if (value !== null && value !== undefined && value !== '') {
      // Special handling for arrays
      if (Array.isArray(value) && value.length > 0) {
        completedWeight += config.weight;
      } else if (!Array.isArray(value)) {
        completedWeight += config.weight;
      } else {
        missingFields.push(config.label);
      }
    } else {
      missingFields.push(config.label);
    }
  });

  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const suggestions = getProfileSuggestions(missingFields, percentage);

  return {
    percentage,
    missingFields,
    suggestions,
  };
}

/**
 * Get suggestions for improving profile completion
 */
function getProfileSuggestions(missingFields: string[], percentage: number): string[] {
  const suggestions: string[] = [];

  if (percentage === 100) {
    return ['¡Tu perfil está completo! 🎉'];
  }

  if (percentage < 50) {
    suggestions.push('Completa tu perfil para obtener mejores recomendaciones de palas');
  }

  // Prioritize important fields
  const priorityFields = ['Nivel de juego', 'Altura', 'Peso'];
  const missingPriority = missingFields.filter(f => priorityFields.includes(f));

  if (missingPriority.length > 0) {
    suggestions.push(`Añade: ${missingPriority.slice(0, 2).join(', ')}`);
  } else if (missingFields.length > 0) {
    suggestions.push(`Añade: ${missingFields.slice(0, 2).join(', ')}`);
  }

  if (percentage >= 80 && percentage < 100) {
    suggestions.push('¡Casi completo! Solo faltan algunos detalles');
  }

  return suggestions;
}

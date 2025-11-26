import { buildApiUrl } from '../config/api';
import { getAuthToken } from '../utils/authUtils';
import { BasicFormData, AdvancedFormData, RecommendationResult, Recommendation } from '../types/recommendation';

export class RecommendationService {
  static async generate(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const url = buildApiUrl('/api/v1/recommendations/generate');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      throw new Error('Error generating recommendation');
    }

    return response.json();
  }

  static async save(
    type: 'basic' | 'advanced',
    formData: BasicFormData | AdvancedFormData,
    result: RecommendationResult
  ): Promise<Recommendation> {
    const url = buildApiUrl('/api/v1/recommendations/save');
    const token = getAuthToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type, formData, result }),
    });

    if (!response.ok) {
      throw new Error('Error saving recommendation');
    }

    return response.json();
  }

  static async getLast(): Promise<Recommendation | null> {
    const url = buildApiUrl('/api/v1/recommendations/last');
    const token = getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      // If it returns a message object instead of null for 404/empty, handle it in component
      // But based on controller, it returns { message: ... } or object. 
      // Let's assume 200 OK with message if not found or object.
    }
    
    const data = await response.json();
    if (data.message) return null;
    
    return data;
  }
}

// Configuración de la API backend
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export { API_BASE_URL };

// Función auxiliar para hacer peticiones HTTP
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      // Intentar obtener el mensaje de error del backend
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        }
      } catch (e) {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error making API request to ${url}:`, error);
    throw error;
  }
};
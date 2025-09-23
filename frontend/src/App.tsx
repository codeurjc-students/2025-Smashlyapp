import { useState, useEffect } from 'react';
import { Racket } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRackets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/rackets?limit=20`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setRackets(data.data.slice(0, 20)); // Asegurar máximo 20 elementos
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching rackets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRackets();
  }, []);

  if (loading) {
    return <div>Cargando palas...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Smashly - Catálogo de Palas de Pádel</h1>
      <p>Mostrando las primeras 20 palas disponibles:</p>
      
      {rackets.length === 0 ? (
        <p>No se encontraron palas.</p>
      ) : (
        <ul>
          {rackets.map((racket, index) => (
            <li key={racket.id || index}>
              <strong>{racket.nombre}</strong>
              {racket.marca && <span> - {racket.marca}</span>}
              {racket.precio_actual && (
                <span> - {racket.precio_actual}€</span>
              )}
            </li>
          ))}
        </ul>
      )}
      
      <p>Total de palas mostradas: {rackets.length}</p>
    </div>
  );
}

export default App;
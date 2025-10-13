import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { RacketService } from "../services/racketService";
import { Racket } from "../types/racket";

// Interfaz para el contexto
interface RacketsContextType {
  rackets: Racket[];
  loading: boolean;
  error: string | null;
  fetchRackets: () => Promise<void>;
  getRacketById: (id: string | number) => Racket | undefined;
  getRacketsByCategory: (category: string) => Racket[];
  searchRackets: (query: string) => Racket[];
  refreshRackets: () => Promise<void>;
}

// Interfaz para las props del provider
interface RacketsProviderProps {
  children: ReactNode;
}

const RacketsContext = createContext<RacketsContextType | null>(null);

export const useRackets = (): RacketsContextType => {
  const context = useContext(RacketsContext);
  if (!context) {
    throw new Error("useRackets debe usarse dentro de RacketsProvider");
  }
  return context;
};

export const RacketsProvider: React.FC<RacketsProviderProps> = ({
  children,
}) => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRackets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Intentar cargar desde Supabase primero
      try {
        const data = await RacketService.getAllRackets();
        setRackets(data);
      } catch (supabaseError) {
        console.warn(
          "Error loading from Supabase, falling back to JSON:",
          supabaseError
        );

        // Fallback a JSON si Supabase falla
        const response = await fetch("/palas_padel.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar ni desde Supabase ni desde JSON");
        }

        const jsonData = await response.json();
        const palas = jsonData.palas || jsonData;

        // Mapear datos del JSON al formato de la interfaz Racket
        const mappedRackets: Racket[] = palas.map((pala: any) => ({
          id: undefined, // JSON no tiene ID
          nombre: pala.nombre,
          marca: pala.marca,
          modelo: pala.modelo,
          precio_actual: pala.precio_actual,
          precio_original: pala.precio_original || null,
          descuento_porcentaje: pala.descuento_porcentaje || 0,
          enlace: pala.enlace,
          imagen: pala.imagen,
          es_bestseller: pala.es_bestseller || false,
          en_oferta: pala.en_oferta || false,
          scrapeado_en: pala.scrapeado_en,
          fuente: pala.fuente,
          created_at: undefined,
          updated_at: undefined,
        }));

        setRackets(mappedRackets);
        console.log(
          `Loaded ${mappedRackets.length} rackets from JSON fallback`
        );
      }
    } catch (error: any) {
      setError(error.message || "Error al cargar las palas");
      console.error("Error fetching rackets:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRackets = async (): Promise<void> => {
    await fetchRackets();
  };

  const getRacketById = (id: string | number): Racket | undefined => {
    const numericId = typeof id === "string" ? parseInt(id) : id;
    return rackets.find((racket) => racket.id === numericId);
  };

  const getRacketsByCategory = (category: string): Racket[] => {
    // Como no tenemos categoría en el JSON, filtraremos por marca
    return rackets.filter((racket) => racket.marca === category);
  };

  const searchRackets = (query: string): Racket[] => {
    const lowerQuery = query.toLowerCase();
    return rackets.filter(
      (racket) =>
        racket.nombre.toLowerCase().includes(lowerQuery) ||
        racket.marca.toLowerCase().includes(lowerQuery) ||
        racket.modelo.toLowerCase().includes(lowerQuery)
    );
  };

  useEffect(() => {
    fetchRackets();
  }, []);

  const value: RacketsContextType = {
    rackets,
    loading,
    error,
    fetchRackets,
    getRacketById,
    getRacketsByCategory,
    searchRackets,
    refreshRackets,
  };

  return (
    <RacketsContext.Provider value={value}>{children}</RacketsContext.Provider>
  );
};

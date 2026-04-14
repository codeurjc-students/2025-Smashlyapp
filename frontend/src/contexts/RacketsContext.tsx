import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
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

  const fetchRackets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await RacketService.getAllRackets();
      setRackets(data);
      console.log(`Loaded ${data.length} rackets from API`);
    } catch (error: any) {
      setError(error.message || "Error al cargar las palas");
      console.error("Error fetching rackets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRackets = useCallback(async (): Promise<void> => {
    await fetchRackets();
  }, [fetchRackets]);

  const getRacketById = useCallback((id: string | number): Racket | undefined => {
    const numericId = typeof id === "string" ? parseInt(id) : id;
    return rackets.find((racket) => racket.id === numericId);
  }, [rackets]);

  const getRacketsByCategory = useCallback((category: string): Racket[] => {
    return rackets.filter((racket) => racket.marca === category);
  }, [rackets]);

  const searchRackets = useCallback((query: string): Racket[] => {
    const lowerQuery = query.toLowerCase();
    return rackets.filter(
      (racket) =>
        (racket.nombre || '').toLowerCase().includes(lowerQuery) ||
        (racket.marca || '').toLowerCase().includes(lowerQuery) ||
        (racket.modelo || '').toLowerCase().includes(lowerQuery)
    );
  }, [rackets]);

  useEffect(() => {
    fetchRackets();
  }, [fetchRackets]);

  const value = useMemo<RacketsContextType>(() => ({
    rackets,
    loading,
    error,
    fetchRackets,
    getRacketById,
    getRacketsByCategory,
    searchRackets,
    refreshRackets,
  }), [rackets, loading, error, fetchRackets, getRacketById, getRacketsByCategory, searchRackets, refreshRackets]);

  return (
    <RacketsContext.Provider value={value}>{children}</RacketsContext.Provider>
  );
};

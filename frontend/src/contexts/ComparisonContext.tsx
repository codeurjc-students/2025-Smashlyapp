import React, { createContext, ReactNode, useContext, useState } from 'react';
import { sileo } from 'sileo';
import { Racket } from '../types/racket';

// Interface for comparison context
interface ComparisonContextType {
  rackets: Racket[];
  count: number;
  addRacket: (racket: Racket) => boolean;
  removeRacket: (racketName: string) => void;
  clearComparison: () => void;
  isRacketInComparison: (racketName: string) => boolean;
}

// Create comparison context
const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

// Provider component props
interface ComparisonProviderProps {
  children: ReactNode;
}

// Comparison Provider component
export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [rackets, setRackets] = useState<Racket[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem('smashly_comparison_list');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever list changes
  React.useEffect(() => {
    localStorage.setItem('smashly_comparison_list', JSON.stringify(rackets));
  }, [rackets]);

  // Add racket to comparison
  const addRacket = (racket: Racket): boolean => {
    // Check if racket is already in comparison
    if (rackets.some(r => r.nombre === racket.nombre)) {
      sileo.error({ title: 'Error', description: 'Esta pala ya está en la comparación' });
      return false; // Already exists
    }

    // Check if comparison is full (max 3 rackets)
    if (rackets.length >= 3) {
      sileo.error({ title: 'Error', description: 'Solo puedes comparar hasta 3 palas a la vez' });
      return false; // Too many rackets
    }

    // Add racket
    setRackets(prev => [...prev, racket]);
    sileo.success({ title: 'Éxito', description: `${racket.nombre} añadida a la comparación` });
    return true; // Success
  };

  // Remove racket from comparison
  const removeRacket = (racketName: string) => {
    setRackets(prev => prev.filter(r => r.nombre !== racketName));
    sileo.success({ title: 'Éxito', description: 'Pala eliminada de la comparación' });
  };

  // Clear all rackets from comparison
  const clearComparison = () => {
    setRackets([]);
    sileo.success({ title: 'Éxito', description: 'Comparación limpiada' });
  };

  // Check if racket is in comparison
  const isRacketInComparison = (racketName: string): boolean => {
    return rackets.some(r => r.nombre === racketName);
  };

  const value: ComparisonContextType = {
    rackets,
    count: rackets.length,
    addRacket,
    removeRacket,
    clearComparison,
    isRacketInComparison,
  };

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
};

// Hook to use comparison context
export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

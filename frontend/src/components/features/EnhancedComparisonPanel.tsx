import React from 'react';
import { useComparison } from '../contexts/ComparisonContext';
import { useRAGRecommendations } from '../hooks/useRAGRecommendations';

// Enhanced comparison component that tracks user interactions for RAG
export const EnhancedComparisonPanel: React.FC = () => {
  const { rackets, addRacket, removeRacket } = useComparison();
  const { trackUserInteraction, isUserLoggedIn } = useRAGRecommendations();

  // Track when user adds racket to comparison
  const handleAddToComparison = async (racket: any) => {
    const success = addRacket(racket);
    
    if (success && isUserLoggedIn) {
      // Track this interaction for RAG learning
      await trackUserInteraction(racket.id, 'compare', {
        context: {
          comparisonSize: rackets.length,
          otherRackets: rackets.map(r => r.id)
        }
      });
    }
  };

  // Track when user views racket details
  const handleViewRacket = async (racketId: number) => {
    if (isUserLoggedIn) {
      await trackUserInteraction(racketId, 'view', {
        context: {
          source: 'comparison_panel',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return (
    <div>
      {/* Your existing comparison panel UI */}
      {rackets.map(racket => (
        <div key={racket.id} onClick={() => handleViewRacket(racket.id)}>
          {/* Racket display */}
        </div>
      ))}
    </div>
  );
};

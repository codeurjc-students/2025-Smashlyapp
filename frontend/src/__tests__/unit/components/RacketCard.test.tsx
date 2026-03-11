import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RacketCard from '../../../components/features/RacketCard';
import { ComparisonProvider } from '../../../contexts/ComparisonContext';

const mockRacket = {
  id: 1,
  nombre: 'Adidas Metalbone 3.1',
  marca: 'Adidas',
  modelo: 'Metalbone 3.1',
  precio_actual: 250,
  imagenes: ['metalbone.jpg'],
  caracteristicas_forma: 'Diamante',
  caracteristicas_balance: 'Alto',
};

describe('RacketCard', () => {
  const renderRacketCard = (racket = mockRacket) => {
    return render(
      <BrowserRouter>
        <ComparisonProvider>
          <RacketCard racket={racket as any} />
        </ComparisonProvider>
      </BrowserRouter>
    );
  };

  it('renders racket information correctly', () => {
    renderRacketCard();
    expect(screen.getByText('Adidas')).toBeInTheDocument();
    expect(screen.getByText('Metalbone 3.1')).toBeInTheDocument();
    // Use partial match for price since it's split into € and 250
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('shows badge when racket has offer', () => {
    const racketWithOffer = { ...mockRacket, en_oferta: true };
    renderRacketCard(racketWithOffer as any);
    expect(screen.getByText(/oferta/i)).toBeInTheDocument();
  });
});

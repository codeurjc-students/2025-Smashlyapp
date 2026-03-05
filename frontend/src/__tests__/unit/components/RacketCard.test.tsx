import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RacketCard from '../../components/RacketCard';
import { ComparisonContext } from '../../contexts/ComparisonContext';

const mockRacket = {
  id: 1,
  nombre: 'Adidas Metalbone 3.1',
  marca: 'Adidas',
  modelo: 'Metalbone 3.1',
  precio: 250,
  imagen: 'metalbone.jpg',
  caracteristicas_forma: 'Diamante',
  caracteristicas_balance: 'Alto',
};

const mockContextValue = {
  comparisonList: [],
  addToComparison: vi.fn(),
  removeFromComparison: vi.fn(),
  clearComparison: vi.fn(),
  isInComparison: vi.fn().mockReturnValue(false),
  isFull: false,
};

describe('RacketCard', () => {
  const renderRacketCard = (racket = mockRacket, context = mockContextValue) => {
    return render(
      <BrowserRouter>
        <ComparisonContext.Provider value={context}>
          <RacketCard racket={racket} />
        </ComparisonContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders racket information correctly', () => {
    renderRacketCard();
    expect(screen.getByText('Adidas Metalbone 3.1')).toBeInTheDocument();
    expect(screen.getByText('Adidas')).toBeInTheDocument();
    expect(screen.getByText('250€')).toBeInTheDocument();
  });

  it('renders "Add to Comparison" button when not in list', () => {
    renderRacketCard();
    const compareBtn = screen.getByTitle(/comparar/i);
    expect(compareBtn).toBeInTheDocument();
  });

  it('calls addToComparison when clicking comparison button', () => {
    renderRacketCard();
    const compareBtn = screen.getByTitle(/comparar/i);
    fireEvent.click(compareBtn);
    expect(mockContextValue.addToComparison).toHaveBeenCalledWith(mockRacket);
  });

  it('shows badge when racket has offer', () => {
    const racketWithOffer = { ...mockRacket, on_offer: true };
    renderRacketCard(racketWithOffer);
    expect(screen.getByText(/oferta/i)).toBeInTheDocument();
  });

  it('changes button style when already in comparison', () => {
    const inComparisonContext = {
      ...mockContextValue,
      isInComparison: vi.fn().mockReturnValue(true),
    };
    renderRacketCard(mockRacket, inComparisonContext);
    const compareBtn = screen.getByTitle(/quitar de la comparativa/i);
    expect(compareBtn).toBeInTheDocument();

    fireEvent.click(compareBtn);
    expect(inComparisonContext.removeFromComparison).toHaveBeenCalledWith(mockRacket.id);
  });
});

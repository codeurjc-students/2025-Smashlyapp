import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ComparisonProvider, useComparison } from '../../../contexts/ComparisonContext';
import { sileo } from 'sileo';

vi.mock('sileo', () => ({
  sileo: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('ComparisonContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockRacket1 = {
    id: 1,
    nombre: 'Racket 1',
    marca: 'Brand 1',
    precio_actual: 100,
    imagenes: ['img1.jpg'],
  };

  const mockRacket2 = {
    id: 2,
    nombre: 'Racket 2',
    marca: 'Brand 2',
    precio_actual: 150,
    imagenes: ['img2.jpg'],
  };

  const mockRacket3 = {
    id: 3,
    nombre: 'Racket 3',
    marca: 'Brand 3',
    precio_actual: 200,
    imagenes: ['img3.jpg'],
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ComparisonProvider>{children}</ComparisonProvider>
  );

  it('should initialize with empty comparison list', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    expect(result.current.rackets).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('should add racket to comparison', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    let success = false;
    act(() => {
      success = result.current.addRacket(mockRacket1);
    });

    expect(success).toBe(true);
    expect(result.current.rackets).toHaveLength(1);
    expect(result.current.rackets[0].nombre).toBe('Racket 1');
    expect(result.current.count).toBe(1);
  });

  it('should not add duplicate racket', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
    });

    let success = true;
    act(() => {
      success = result.current.addRacket(mockRacket1);
    });

    expect(success).toBe(false);
    expect(result.current.rackets).toHaveLength(1);
    expect(sileo.error).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
  });

  it('should not add more than 3 rackets', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
      result.current.addRacket(mockRacket2);
      result.current.addRacket(mockRacket3);
    });

    let success = true;
    act(() => {
      success = result.current.addRacket({ ...mockRacket1, id: 4, nombre: 'Racket 4' });
    });

    expect(success).toBe(false);
    expect(result.current.rackets).toHaveLength(3);
    expect(sileo.error).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
  });

  it('should remove racket from comparison', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
      result.current.addRacket(mockRacket2);
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.removeRacket('Racket 1');
    });

    expect(result.current.count).toBe(1);
    expect(result.current.rackets[0].nombre).toBe('Racket 2');
  });

  it('should clear all rackets', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
      result.current.addRacket(mockRacket2);
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearComparison();
    });

    expect(result.current.count).toBe(0);
    expect(result.current.rackets).toEqual([]);
  });

  it('should check if racket is in comparison', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
    });

    expect(result.current.isRacketInComparison('Racket 1')).toBe(true);
    expect(result.current.isRacketInComparison('Racket 2')).toBe(false);
  });

  it('should persist to localStorage', async () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addRacket(mockRacket1);
    });

    const stored = localStorage.getItem('smashly_comparison_list');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].nombre).toBe('Racket 1');
  });
});

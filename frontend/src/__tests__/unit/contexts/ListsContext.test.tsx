import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ListsProvider, useList } from '../../../contexts/ListsContext';
import { ListService } from '../../../services/listService';

vi.mock('../../../services/listService');
vi.mock('sileo', () => ({
  sileo: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('ListsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLists = [
    { id: '1', name: 'Mis Favoritas', user_id: 'user1', racket_count: 5 },
    { id: '2', name: 'Para Comprar', user_id: 'user1', racket_count: 3 },
  ];

  it('should initialize with empty lists', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    expect(result.current.lists).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch lists when fetchLists is called', async () => {
    (ListService.getUserLists as any).mockResolvedValueOnce(mockLists);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    expect(result.current.lists).toEqual(mockLists);
  });

  it('should handle fetch error', async () => {
    (ListService.getUserLists as any).mockRejectedValueOnce(new Error('Network error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    expect(result.current.lists).toEqual([]);
    const { sileo } = await import('sileo');
    expect(sileo.error).toHaveBeenCalled();
  });

  it('should create new list', async () => {
    const newList = { id: '3', name: 'Nueva Lista', user_id: 'user1', racket_count: 0 };
    (ListService.createList as any).mockResolvedValueOnce(newList);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    let createdList: any = null;
    await act(async () => {
      createdList = await result.current.createList({ name: 'Nueva Lista' });
    });

    expect(createdList).toEqual(newList);
    expect(ListService.createList).toHaveBeenCalledWith({ name: 'Nueva Lista' });
    const { sileo } = await import('sileo');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should update list', async () => {
    (ListService.updateList as any).mockResolvedValueOnce({ id: '1', name: 'Updated Name' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.updateList('1', 'Updated Name');
    });

    expect(ListService.updateList).toHaveBeenCalledWith('1', { name: 'Updated Name', description: undefined });
    const { sileo } = await import('sileo');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should add racket to list', async () => {
    (ListService.addRacketToList as any).mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.addRacketToList('1', 123);
    });

    expect(ListService.addRacketToList).toHaveBeenCalledWith('1', 123);
    const { sileo } = await import('sileo');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should remove racket from list', async () => {
    (ListService.removeRacketFromList as any).mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.removeRacketFromList('1', 123);
    });

    expect(ListService.removeRacketFromList).toHaveBeenCalledWith('1', 123);
    const { sileo } = await import('sileo');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should delete list', async () => {
    (ListService.deleteList as any).mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListsProvider>{children}</ListsProvider>
    );
    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.deleteList('1');
    });

    expect(ListService.deleteList).toHaveBeenCalledWith('1');
    const { sileo } = await import('sileo');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });
});

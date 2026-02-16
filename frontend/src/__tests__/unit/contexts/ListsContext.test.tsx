import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ListsProvider, useList } from '../../../contexts/ListsContext';
import { ListService } from '../../../services/listService';
import toast from 'react-hot-toast';

vi.mock('../../../services/listService');
vi.mock('react-hot-toast');

describe('ListsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ListsProvider>{children}</ListsProvider>
  );

  const mockLists = [
    { id: '1', name: 'Mis Favoritas', user_id: 'user1', racket_count: 5 },
    { id: '2', name: 'Para Comprar', user_id: 'user1', racket_count: 3 },
  ];

  it('should initialize with empty lists', () => {
    const { result } = renderHook(() => useList(), { wrapper });

    expect(result.current.lists).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch lists', async () => {
    vi.mocked(ListService.getUserLists).mockResolvedValue(mockLists);

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    expect(result.current.lists).toEqual(mockLists);
    expect(result.current.loading).toBe(false);
  });

  it('should handle fetch error', async () => {
    vi.mocked(ListService.getUserLists).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should create new list', async () => {
    const newList = { id: '3', name: 'Nueva Lista', user_id: 'user1', racket_count: 0 };
    vi.mocked(ListService.createList).mockResolvedValue(newList);

    const { result } = renderHook(() => useList(), { wrapper });

    let createdList: any;
    await act(async () => {
      createdList = await result.current.createList({ name: 'Nueva Lista' });
    });

    expect(createdList).toEqual(newList);
    expect(result.current.lists).toContainEqual(newList);
    expect(toast.success).toHaveBeenCalledWith('Lista creada exitosamente');
  });

  it('should update list', async () => {
    const updatedList = { ...mockLists[0], name: 'Updated Name' };
    vi.mocked(ListService.updateList).mockResolvedValue(updatedList);
    vi.mocked(ListService.getUserLists).mockResolvedValue(mockLists);

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    await act(async () => {
      await result.current.updateList('1', 'Updated Name');
    });

    expect(result.current.lists[0].name).toBe('Updated Name');
    expect(toast.success).toHaveBeenCalledWith('Lista actualizada exitosamente');
  });

  it('should delete list', async () => {
    vi.mocked(ListService.deleteList).mockResolvedValue();
    vi.mocked(ListService.getUserLists).mockResolvedValue(mockLists);

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.fetchLists();
    });

    expect(result.current.lists).toHaveLength(2);

    await act(async () => {
      await result.current.deleteList('1');
    });

    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].id).toBe('2');
  });

  it('should add racket to list', async () => {
    vi.mocked(ListService.addRacketToList).mockResolvedValue();

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.addRacketToList('1', 123);
    });

    expect(ListService.addRacketToList).toHaveBeenCalledWith('1', 123);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should remove racket from list', async () => {
    vi.mocked(ListService.removeRacketFromList).mockResolvedValue();

    const { result } = renderHook(() => useList(), { wrapper });

    await act(async () => {
      await result.current.removeRacketFromList('1', 123);
    });

    expect(ListService.removeRacketFromList).toHaveBeenCalledWith('1', 123);
    expect(toast.success).toHaveBeenCalled();
  });
});

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { sileo } from 'sileo';
import { List, ListWithRackets, CreateListRequest } from '../types/list';
import { ListService } from '../services/listService';

interface ListsContextType {
  lists: List[];
  loading: boolean;
  fetchLists: () => Promise<void>;
  createList: (data: CreateListRequest) => Promise<List | null>;
  updateList: (listId: string, name: string, description?: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  getListById: (listId: string) => Promise<ListWithRackets | null>;
  addRacketToList: (listId: string, racketId: number) => Promise<void>;
  removeRacketFromList: (listId: string, racketId: number) => Promise<void>;
}

interface ListsProviderProps {
  children: ReactNode;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export const useList = (): ListsContextType => {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error('useList debe usarse dentro de ListsProvider');
  }
  return context;
};

export const ListsProvider: React.FC<ListsProviderProps> = ({ children }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Obtiene todas las listas del usuario
   */
  const fetchLists = async () => {
    try {
      setLoading(true);
      const userLists = await ListService.getUserLists();
      setLists(userLists);
    } catch (error: any) {
      console.error('Error fetching lists:', error);
      sileo.error({ title: 'Error', description: error.message || 'Error al cargar las listas' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crea una nueva lista
   */
  const createList = async (data: CreateListRequest): Promise<List | null> => {
    try {
      const newList = await ListService.createList(data);
      setLists(prev => [newList, ...prev]);
      sileo.success({ title: 'Éxito', description: 'Lista creada exitosamente' });
      return newList;
    } catch (error: any) {
      console.error('Error creating list:', error);
      sileo.error({ title: 'Error', description: error.message || 'Error al crear la lista' });
      return null;
    }
  };

  /**
   * Actualiza una lista
   */
  const updateList = async (listId: string, name: string, description?: string) => {
    try {
      const updated = await ListService.updateList(listId, {
        name,
        description,
      });
      setLists(prev => prev.map(list => (list.id === listId ? updated : list)));
      sileo.success({ title: 'Éxito', description: 'Lista actualizada exitosamente' });
    } catch (error: any) {
      console.error('Error updating list:', error);
      sileo.error({ title: 'Error', description: error.message || 'Error al actualizar la lista' });
      throw error;
    }
  };

  /**
   * Elimina una lista
   */
  const deleteList = async (listId: string) => {
    try {
      await ListService.deleteList(listId);
      setLists(prev => prev.filter(list => list.id !== listId));
      sileo.success({ title: 'Éxito', description: 'Lista eliminada exitosamente' });
    } catch (error: any) {
      console.error('Error deleting list:', error);
      sileo.error({ title: 'Error', description: error.message || 'Error al eliminar la lista' });
      throw error;
    }
  };

  /**
   * Obtiene una lista con sus palas
   */
  const getListById = async (listId: string): Promise<ListWithRackets | null> => {
    try {
      return await ListService.getListById(listId);
    } catch (error: any) {
      console.error('Error getting list:', error);
      sileo.error({ title: 'Error', description: error.message || 'Error al obtener la lista' });
      return null;
    }
  };

  /**
   * Añade una pala a una lista
   */
  const addRacketToList = async (listId: string, racketId: number) => {
    try {
      await ListService.addRacketToList(listId, racketId);
      // Actualizar el contador de palas en la lista
      setLists(prev =>
        prev.map(list =>
          list.id === listId ? { ...list, racket_count: (list.racket_count || 0) + 1 } : list
        )
      );
      sileo.success({ title: 'Éxito', description: 'Pala añadida a la lista' });
    } catch (error: any) {
      console.error('Error adding racket to list:', error);
      sileo.error({
        title: 'Error',
        description: error.message || 'Error al añadir pala a la lista',
      });
      throw error;
    }
  };

  /**
   * Elimina una pala de una lista
   */
  const removeRacketFromList = async (listId: string, racketId: number) => {
    try {
      await ListService.removeRacketFromList(listId, racketId);
      // Actualizar el contador de palas en la lista
      setLists(prev =>
        prev.map(list =>
          list.id === listId
            ? {
                ...list,
                racket_count: Math.max(0, (list.racket_count || 0) - 1),
              }
            : list
        )
      );
      sileo.success({ title: 'Éxito', description: 'Pala eliminada de la lista' });
    } catch (error: any) {
      console.error('Error removing racket from list:', error);
      sileo.error({
        title: 'Error',
        description: error.message || 'Error al eliminar pala de la lista',
      });
      throw error;
    }
  };

  const value: ListsContextType = {
    lists,
    loading,
    fetchLists,
    createList,
    updateList,
    deleteList,
    getListById,
    addRacketToList,
    removeRacketFromList,
  };

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
};

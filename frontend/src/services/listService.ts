import { API_URL } from "../config/api";
import { getAuthToken } from "../utils/authUtils";
import {
  List,
  ListWithRackets,
  CreateListRequest,
  UpdateListRequest,
} from "../types/list";

/**
 * Servicio para gestionar las listas de palas del usuario
 */
export class ListService {
  /**
   * Obtiene todas las listas del usuario autenticado
   */
  static async getUserLists(): Promise<List[]> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener las listas");
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Obtiene una lista específica con sus palas
   */
  static async getListById(listId: string): Promise<ListWithRackets> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists/${listId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener la lista");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Crea una nueva lista
   */
  static async createList(listData: CreateListRequest): Promise<List> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(listData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear la lista");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Actualiza una lista
   */
  static async updateList(
    listId: string,
    updates: UpdateListRequest
  ): Promise<List> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists/${listId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar la lista");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Elimina una lista
   */
  static async deleteList(listId: string): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists/${listId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar la lista");
    }
  }

  /**
   * Añade una pala a una lista
   */
  static async addRacketToList(
    listId: string,
    racketId: number
  ): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(`${API_URL}/users/lists/${listId}/rackets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ racket_id: racketId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al añadir pala a la lista");
    }
  }

  /**
   * Elimina una pala de una lista
   */
  static async removeRacketFromList(
    listId: string,
    racketId: number
  ): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    const response = await fetch(
      `${API_URL}/users/lists/${listId}/rackets/${racketId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar pala de la lista");
    }
  }
}

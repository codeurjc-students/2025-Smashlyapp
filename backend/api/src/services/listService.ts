import { supabase } from "../config/supabase";
import {
  List,
  ListWithRackets,
  CreateListRequest,
  UpdateListRequest,
} from "../types/list";

export class ListService {
  /**
   * Obtiene todas las listas de un usuario
   */
  static async getUserLists(userId: string): Promise<ListWithRackets[]> {
    const { data, error } = await supabase
      .from("lists")
      .select(
        `
        *,
        list_rackets (
          racket_id
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error al obtener listas: ${error.message}`);
    }

    // Contar palas por lista
    return data.map((list) => ({
      ...list,
      racket_count: list.list_rackets?.length || 0,
    }));
  }

  /**
   * Obtiene una lista específica con sus palas
   */
  static async getListById(
    listId: string,
    userId: string
  ): Promise<ListWithRackets | null> {
    const { data, error } = await supabase
      .from("lists")
      .select(
        `
        *,
        list_rackets (
          racket_id,
          added_at,
          rackets (*)
        )
      `
      )
      .eq("id", listId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener lista: ${error.message}`);
    }

    return {
      ...data,
      rackets:
        data.list_rackets?.map((lr: { rackets: any }) => lr.rackets) || [],
      racket_count: data.list_rackets?.length || 0,
    };
  }

  /**
   * Crea una nueva lista
   */
  static async createList(
    userId: string,
    listData: CreateListRequest
  ): Promise<List> {
    const { data, error } = await supabase
      .from("lists")
      .insert({
        user_id: userId,
        name: listData.name,
        description: listData.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear lista: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualiza una lista
   */
  static async updateList(
    listId: string,
    userId: string,
    updates: UpdateListRequest
  ): Promise<List> {
    const { data, error } = await supabase
      .from("lists")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar lista: ${error.message}`);
    }

    return data;
  }

  /**
   * Elimina una lista
   */
  static async deleteList(listId: string, userId: string): Promise<void> {
    // Primero eliminar las relaciones en list_rackets (cascade debería hacerlo automáticamente)
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error al eliminar lista: ${error.message}`);
    }
  }

  /**
   * Añade una pala a una lista
   */
  static async addRacketToList(
    listId: string,
    userId: string,
    racketId: number
  ): Promise<void> {
    // Verificar que la lista pertenece al usuario
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("Lista no encontrada o no pertenece al usuario");
    }

    // Verificar si la pala ya está en la lista
    const { data: existing } = await supabase
      .from("list_rackets")
      .select("*")
      .eq("list_id", listId)
      .eq("racket_id", racketId)
      .single();

    if (existing) {
      throw new Error("La pala ya está en la lista");
    }

    const { error } = await supabase.from("list_rackets").insert({
      list_id: listId,
      racket_id: racketId,
    });

    if (error) {
      throw new Error(`Error al añadir pala a la lista: ${error.message}`);
    }
  }

  /**
   * Elimina una pala de una lista
   */
  static async removeRacketFromList(
    listId: string,
    userId: string,
    racketId: number
  ): Promise<void> {
    // Verificar que la lista pertenece al usuario
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("Lista no encontrada o no pertenece al usuario");
    }

    const { error } = await supabase
      .from("list_rackets")
      .delete()
      .eq("list_id", listId)
      .eq("racket_id", racketId);

    if (error) {
      throw new Error(`Error al eliminar pala de la lista: ${error.message}`);
    }
  }
}

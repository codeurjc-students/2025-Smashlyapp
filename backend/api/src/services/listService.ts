import { supabase } from "../config/supabase";
import {
  List,
  ListWithRackets,
  CreateListRequest,
  UpdateListRequest,
} from "../types/list";

export class ListService {
  /**
   * Gets all lists for a user
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
      throw new Error(`Error getting lists: ${error.message}`);
    }

    // Count rackets per list
    return data.map((list) => ({
      ...list,
      racket_count: list.list_rackets?.length || 0,
    }));
  }

  /**
   * Gets a specific list with its rackets
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
      throw new Error(`Error getting list: ${error.message}`);
    }

    return {
      ...data,
      rackets:
        data.list_rackets?.map((lr: { rackets: unknown }) => lr.rackets) || [],
      racket_count: data.list_rackets?.length || 0,
    };
  }

  /**
   * Creates a new list
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
      throw new Error(`Error creating list: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates a list
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
      throw new Error(`Error updating list: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletes a list
   */
  static async deleteList(listId: string, userId: string): Promise<void> {
    // First delete relationships in list_rackets (cascade should do this automatically)
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error deleting list: ${error.message}`);
    }
  }

  /**
   * Adds a racket to a list
   */
  static async addRacketToList(
    listId: string,
    userId: string,
    racketId: number
  ): Promise<void> {
    // Verify that the list belongs to the user
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("List not found or does not belong to user");
    }

    // Check if the racket is already in the list
    const { data: existing } = await supabase
      .from("list_rackets")
      .select("*")
      .eq("list_id", listId)
      .eq("racket_id", racketId)
      .single();

    if (existing) {
      throw new Error("The racket is already in the list");
    }

    const { error } = await supabase.from("list_rackets").insert({
      list_id: listId,
      racket_id: racketId,
    });

    if (error) {
      throw new Error(`Error adding racket to list: ${error.message}`);
    }
  }

  /**
   * Removes a racket from a list
   */
  static async removeRacketFromList(
    listId: string,
    userId: string,
    racketId: number
  ): Promise<void> {
    // Verify that the list belongs to the user
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("List not found or does not belong to user");
    }

    const { error } = await supabase
      .from("list_rackets")
      .delete()
      .eq("list_id", listId)
      .eq("racket_id", racketId);

    if (error) {
      throw new Error(`Error removing racket from list: ${error.message}`);
    }
  }
}

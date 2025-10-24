import { Racket } from "./racket";

/**
 * Tipos para las listas de palas favoritas
 */

export interface List {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  racket_count?: number;
}

export interface ListWithRackets extends List {
  rackets?: Racket[];
}

export interface CreateListRequest {
  name: string;
  description?: string;
}

export interface UpdateListRequest {
  name?: string;
  description?: string;
}

export interface AddRacketToListRequest {
  racket_id: number;
}

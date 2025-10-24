export interface List {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ListRacket {
  list_id: string;
  racket_id: number;
  added_at: string;
}

export interface ListWithRackets extends List {
  rackets?: any[]; // O usar el tipo Racket que ya tienes
  racket_count?: number;
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

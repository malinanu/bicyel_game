export interface Entry {
  id: number;
  user_id: number;
  image_url: string;
  image_hash: string;
  image_size: number;
  verified: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryCreateResponse {
  success: boolean;
  entry: Entry;
  entries_remaining: number;
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  message: string;
  existing_entry_id?: number;
}

export interface EntryListResponse {
  success: boolean;
  entries: Entry[];
  total_entries: number;
  entries_remaining: number;
}

export interface CodeValidateRequest {
  code: string;
}

export interface CodeValidateResponse {
  success: boolean;
  message: string;
  code_id: number | null;
}

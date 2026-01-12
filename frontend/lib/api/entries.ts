import { apiClient } from './client';
import type { Entry, EntryCreateResponse, DuplicateCheckResponse, EntryListResponse, CodeValidateResponse } from '@/lib/types/entry';

export const entriesApi = {
  getEntries: async (): Promise<EntryListResponse> => {
    const response = await apiClient.get<EntryListResponse>('/entries');
    return response.data;
  },

  validateCode: async (code: string): Promise<CodeValidateResponse> => {
    const response = await apiClient.post('/entries/validate-code', { code });
    return response.data;
  },

  createEntry: async (imageFile: File, codeId: number): Promise<EntryCreateResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('code_id', codeId.toString());
    const response = await apiClient.post('/entries', formData);
    return response.data;
  },

  checkDuplicate: async (imageFile: File): Promise<DuplicateCheckResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post('/entries/check-duplicate', formData);
    return response.data;
  },
};

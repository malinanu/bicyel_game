import { apiClient } from './client';
import type { Entry, EntryCreateResponse, DuplicateCheckResponse } from '@/lib/types/entry';

export const entriesApi = {
  getEntries: async (): Promise<Entry[]> => {
    const response = await apiClient.get('/entries');
    return response.data;
  },

  createEntry: async (imageFile: File): Promise<EntryCreateResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post('/entries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  checkDuplicate: async (imageFile: File): Promise<DuplicateCheckResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post('/entries/check-duplicate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

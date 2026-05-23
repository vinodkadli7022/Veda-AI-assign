import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Assessment,
  CreateAssessmentPayload,
  ApiResponse,
} from '@/types';

const BASE_URL =
  typeof window !== 'undefined'
    ? '/api'
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const assessmentApi = {
  create: async (payload: CreateAssessmentPayload): Promise<{ id: string; status: string }> => {
    const response = await api.post<ApiResponse<{ id: string; status: string }>>(
      '/assessments',
      payload
    );
    return response.data.data!;
  },

  getById: async (id: string): Promise<Assessment> => {
    const response = await api.get<ApiResponse<Assessment>>(`/assessments/${id}`);
    return response.data.data!;
  },

  getStatus: async (id: string): Promise<{ status: string; errorMessage?: string }> => {
    const response = await api.get<ApiResponse<{ status: string; errorMessage?: string }>>(
      `/assessments/${id}/status`
    );
    return response.data.data!;
  },

  list: async (page = 1, limit = 10): Promise<{ data: Assessment[]; total: number }> => {
    const response = await api.get(`/assessments?page=${page}&limit=${limit}`);
    return { data: response.data.data, total: response.data.total };
  },

  regenerate: async (id: string): Promise<void> => {
    await api.post(`/assessments/${id}/regenerate`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  },
};

export default api;

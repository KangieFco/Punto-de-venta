import client from './client'
import type { ApiResponse } from '../types/api'

export interface Category {
  id:          number
  name:        string
  description: string | null
  active:      boolean
  createdAt:   string
}

export interface SaveCategoryRequest {
  name:        string
  description?: string
}

export const categoriesApi = {
  getAll:     (onlyActive?: boolean) =>
    client.get<ApiResponse<Category[]>>('/categories', {
      params: onlyActive !== undefined ? { onlyActive } : {}
    }),

  getById:    (id: number) =>
    client.get<ApiResponse<Category>>(`/categories/${id}`),

  create:     (data: SaveCategoryRequest) =>
    client.post<ApiResponse<Category>>('/categories', data),

  update:     (id: number, data: SaveCategoryRequest) =>
    client.put<ApiResponse<Category>>(`/categories/${id}`, data),

  activate:   (id: number) =>
    client.patch(`/categories/${id}/activate`),

  deactivate: (id: number) =>
    client.patch(`/categories/${id}/deactivate`),
}
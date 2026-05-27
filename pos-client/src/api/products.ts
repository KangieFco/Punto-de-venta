import client from './client'
import type { ApiResponse } from '../types/api'

export interface Product {
  id:           number
  code:         string
  barcode:      string | null
  name:         string
  description:  string | null
  categoryId:   number
  categoryName: string
  costPrice:    number
  salePrice:    number
  stock:        number
  minStock:     number
  unit:         string
  active:       boolean
  isLowStock:   boolean
}

export interface SaveProductRequest {
  code:        string
  barcode?:    string
  name:        string
  description?: string
  categoryId:  number
  costPrice:   number
  salePrice:   number
  stock:       number
  minStock:    number
  unit:        string
}

export const productsApi = {
  getAll:       (onlyActive?: boolean) =>
    client.get<ApiResponse<Product[]>>('/products', {
      params: onlyActive !== undefined ? { onlyActive } : {}
    }),

  getById:      (id: number) =>
    client.get<ApiResponse<Product>>(`/products/${id}`),

  search:       (query: string) =>
    client.get<ApiResponse<Product[]>>('/products/search', { params: { query } }),

  getByBarcode: (barcode: string) =>
    client.get<ApiResponse<Product>>(`/products/barcode/${barcode}`),

  getLowStock:  () =>
    client.get<ApiResponse<Product[]>>('/products/low-stock'),

  create:       (data: SaveProductRequest) =>
    client.post<ApiResponse<Product>>('/products', data),

  update:       (id: number, data: SaveProductRequest) =>
    client.put<ApiResponse<Product>>(`/products/${id}`, data),

  activate:     (id: number) =>
    client.patch(`/products/${id}/activate`),

  deactivate:   (id: number) =>
    client.patch(`/products/${id}/deactivate`),
}
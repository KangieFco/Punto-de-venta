import client from './client'
import type { ApiResponse } from '../types/api'

export interface InventoryMovement {
  id:            number
  productId:     number
  productName:   string
  movementType:  string
  quantity:      number
  previousStock: number
  newStock:      number
  reason:        string | null
  reference:     string | null
  userFullName:  string
  createdAt:     string
}

export const inventoryApi = {
  getMovements:   (productId?: number) =>
    client.get<ApiResponse<InventoryMovement[]>>('/inventory/movements', {
      params: productId ? { productId } : {}
    }),

  entry:          (data: { productId: number; quantity: number; reason?: string }) =>
    client.post('/inventory/entry', data),

  output:         (data: { productId: number; quantity: number; reason?: string }) =>
    client.post('/inventory/output', data),

  adjustment:     (data: { productId: number; newStock: number; reason?: string }) =>
    client.post('/inventory/adjustment', data),
}
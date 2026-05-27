import client from './client'
import type { ApiResponse } from '../types/api'

export interface SaleDetail {
  productId:   number
  productName: string
  quantity:    number
  unitPrice:   number
  discount:    number
  subtotal:    number
}

export interface Sale {
  id:             number
  folio:          string
  userId:         number
  userFullName:   string
  cashRegisterId: number
  subtotal:       number
  discount:       number
  tax:            number
  total:          number
  paymentMethod:  string
  amountReceived: number
  changeAmount:   number
  status:         string
  createdAt:      string
  details:        SaleDetail[]
}

export interface CreateSaleRequest {
  items: { productId: number; quantity: number; discount: number }[]
  paymentMethod:  number
  amountReceived: number
  discount:       number
  cashRegisterId: number
}

export const salesApi = {
  getAll:     () =>
    client.get<ApiResponse<Sale[]>>('/sales'),

  getById:    (id: number) =>
    client.get<ApiResponse<Sale>>(`/sales/${id}`),

  getByFolio: (folio: string) =>
    client.get<ApiResponse<Sale>>(`/sales/folio/${folio}`),

  create:     (data: CreateSaleRequest) =>
    client.post<ApiResponse<Sale>>('/sales', data),

  cancel:     (id: number, reason: string) =>
    client.post(`/sales/${id}/cancel`, { reason }),
}
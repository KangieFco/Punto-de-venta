import client from './client'
import type { ApiResponse } from '../types/api'

export interface LayawayDetail {
  productId: number
  productName: string
  imageUrl: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface LayawayPayment {
  id: number
  amount: number
  paymentMethod: string
  userFullName: string
  createdAt: string
  notes: string | null
}

export interface Layaway {
  id: number
  folio: string
  clientName: string
  clientPhone: string | null
  total: number
  deposit: number
  remaining: number
  status: string
  userFullName: string
  createdAt: string
  saleId: number | null
  saleFolio: string | null
  expiresAt: string
  daysLeft: number
  isExpired: boolean
  completedAt: string | null
  details: LayawayDetail[]
  payments: LayawayPayment[]
}

export const layawaysApi = {
  getAll: (status?: string) =>
    client.get<ApiResponse<Layaway[]>>('/layaways', {
      params: status ? { status } : {},
    }),

  getById: (id: number) =>
    client.get<ApiResponse<Layaway>>(`/layaways/${id}`),

  create: (data: {
    clientName: string
    clientPhone?: string
    deposit: number
    paymentMethod: number
    items: { productId: number; quantity: number }[]
  }) => client.post<ApiResponse<Layaway>>('/layaways', data),

  addDeposit: (id: number, amount: number, paymentMethod: number) =>
  client.post<ApiResponse<Layaway>>(`/layaways/${id}/deposit`, { amount, paymentMethod }),

  cancel: (id: number) =>
    client.post(`/layaways/${id}/cancel`),
}
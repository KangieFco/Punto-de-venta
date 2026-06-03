import client from './client'
import type { ApiResponse } from '../types/api'

export interface LayawayDetail {
  productId:   number
  productName: string
  imageUrl:    string | null
  quantity:    number
  unitPrice:   number
  subtotal:    number
}

export interface Layaway {
  id:           number
  folio:        string
  clientName:   string
  clientPhone:  string | null
  total:        number
  deposit:      number
  remaining:    number
  status:       string
  userFullName: string
  createdAt:    string
  completedAt:  string | null
  details:      LayawayDetail[]
}

export const layawaysApi = {
  getAll:     (status?: string) =>
    client.get<ApiResponse<Layaway[]>>('/layaways', {
      params: status ? { status } : {}
    }),

  getById:    (id: number) =>
    client.get<ApiResponse<Layaway>>(`/layaways/${id}`),

  create:     (data: {
    clientName:  string
    clientPhone?: string
    deposit:     number
    items: { productId: number; quantity: number }[]
  }) => client.post<ApiResponse<Layaway>>('/layaways', data),

  addDeposit: (id: number, amount: number) =>
    client.post<ApiResponse<Layaway>>(`/layaways/${id}/deposit`, { amount }),

  cancel:     (id: number) =>
    client.post(`/layaways/${id}/cancel`),
}
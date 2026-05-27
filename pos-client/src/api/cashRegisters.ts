import client from './client'
import type { ApiResponse } from '../types/api'

export interface CashRegister {
  id:             number
  userId:         number
  userFullName:   string
  openingAmount:  number
  closingAmount:  number | null
  expectedAmount: number | null
  difference:     number | null
  status:         string
  openedAt:       string
  closedAt:       string | null
}

export interface CashMovement {
  id:             number
  cashRegisterId: number
  type:           string
  amount:         number
  reason:         string | null
  userFullName:   string
  createdAt:      string
}

export const cashRegistersApi = {
  open:         (openingAmount: number) =>
    client.post<ApiResponse<CashRegister>>('/cash-registers/open', { openingAmount }),

  close:        (id: number, closingAmount: number) =>
    client.post<ApiResponse<CashRegister>>(`/cash-registers/${id}/close`, { closingAmount }),

  getCurrent:   () =>
    client.get<ApiResponse<CashRegister | null>>('/cash-registers/current'),

  getAll:       () =>
    client.get<ApiResponse<CashRegister[]>>('/cash-registers'),

  getById:      (id: number) =>
    client.get<ApiResponse<CashRegister>>(`/cash-registers/${id}`),

  addIncoming:  (data: { amount: number; reason?: string }) =>
    client.post<ApiResponse<CashMovement>>('/cash-movements/in', data),

  addOutgoing:  (data: { amount: number; reason?: string }) =>
    client.post<ApiResponse<CashMovement>>('/cash-movements/out', data),

  getMovements: (cashRegisterId: number) =>
    client.get<ApiResponse<CashMovement[]>>(
      `/cash-movements/cash-register/${cashRegisterId}`
    ),
}
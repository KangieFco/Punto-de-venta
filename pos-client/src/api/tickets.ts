import client from './client'
import type { ApiResponse } from '../types/api'

export interface Ticket {
  id:           number
  saleId:       number
  folio:        string
  printedCount: number
  lastPrintedAt: string | null
  createdAt:    string
  ticketText?:  string
}

export const ticketsApi = {
  getBySale:  (saleId: number) =>
    client.get<ApiResponse<Ticket>>(`/tickets/sale/${saleId}`),

  print:      (id: number) =>
    client.post<ApiResponse<Ticket>>(`/tickets/${id}/print`),

  reprint:    (id: number) =>
    client.post<ApiResponse<Ticket>>(`/tickets/${id}/reprint`),
}
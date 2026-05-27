import client from './client'
import type { ApiResponse } from '../types/api'

export interface SalesReport {
  from:           string
  to:             string
  totalSales:     number
  cancelledSales: number
  totalRevenue:   number
  sales: {
    folio:         string
    userFullName:  string
    total:         number
    paymentMethod: string
    status:        string
    createdAt:     string
  }[]
}

export interface TopProduct {
  productId:         number
  productName:       string
  totalQuantitySold: number
  totalRevenue:      number
}

export interface DailySummary {
  date:           string
  totalSales:     number
  totalRevenue:   number
  cashRevenue:    number
  cardRevenue:    number
  otherRevenue:   number
  cancelledSales: number
  topProducts:    TopProduct[]
}

export const reportsApi = {
  getSales: (from: string, to: string) =>
    client.get<ApiResponse<SalesReport>>('/reports/sales', {
      params: { from, to }
    }),

  getTopProducts: (from: string, to: string, top = 10) =>
    client.get<ApiResponse<TopProduct[]>>('/reports/top-products', {
      params: { from, to, top }
    }),

  getDailySummary: (date: string) =>
    client.get<ApiResponse<DailySummary>>('/reports/daily-summary', {
      params: { date }
    }),
}
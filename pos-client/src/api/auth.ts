import client from './client'
import type { LoginRequest, LoginResponse } from '../types/auth'
import type { ApiResponse } from '../types/api'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    client.post('/auth/logout'),

  me: () =>
    client.get<ApiResponse<LoginResponse['user']>>('/auth/me'),
}
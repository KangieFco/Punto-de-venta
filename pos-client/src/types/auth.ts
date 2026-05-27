export interface LoginRequest {
  username: string
  password: string
}

export interface UserSession {
  id:       number
  fullName: string
  username: string
  role:     string
}

export interface LoginResponse {
  token: string
  user:  UserSession
}
export interface User {
  id?: number;
  name: string;
  email: string;
  mobile?: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
}
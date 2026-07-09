import { httpClient } from '../../../shared/lib/httpClient';
import type { AuthResponse, LoginRequest, SignupRequest } from '../types/auth';

export async function login(payload: LoginRequest) {
  const { data } = await httpClient.post<AuthResponse>('/auth/login', payload);

  return data;
}

export async function signup(payload: SignupRequest) {
  const { data } = await httpClient.post<AuthResponse>('/auth/signup', payload);

  return data;
}

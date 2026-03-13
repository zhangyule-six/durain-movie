import { useRequest } from './http'
import type { AuthUser, LoginPayload, SignupPayload } from './types'

export function useLogin(payload: LoginPayload) {
  return useRequest<AuthUser, LoginPayload>({
    url: '/api/auth/login',
    method: 'POST',
    body: payload,
  })
}

export function useSignup(payload: SignupPayload) {
  return useRequest<AuthUser, SignupPayload>({
    url: '/api/auth/signup',
    method: 'POST',
    body: payload,
  })
}

export function useLogout() {
  return useRequest<void, undefined>({
    url: '/api/auth/logout',
    method: 'POST',
  })
}

export function useCheckAuth() {
  return useRequest<AuthUser, undefined>({
    url: '/api/auth/check',
    method: 'GET',
  })
}


import request from '@/utils/request'

export const register = (data) => {
  return request.post('/auth/register', data)
}

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const getUserInfo = () => {
  return request.get('/auth/userinfo')
}

export const forgotPassword = (email) => {
  return request.post('/auth/forgot-password', { email })
}

export const resetPassword = (token, password) => {
  return request.post('/auth/reset-password', { token, password })
}

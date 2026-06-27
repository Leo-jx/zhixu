import request from '@/utils/request'

export const getUserStats = () => {
  return request.get('/user/stats')
}

export const getPracticeHistory = (params) => {
  return request.get('/user/practice-history', { params })
}

export const updatePassword = (oldPassword, newPassword) => {
  return request.put('/user/password', { oldPassword, newPassword })
}

export const updateProfile = (data) => {
  return request.put('/user/profile', data)
}

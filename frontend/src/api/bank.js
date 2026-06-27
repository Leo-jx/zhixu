import request from '@/utils/request'

export const getBankList = (params) => {
  return request.get('/bank/list', { params })
}

export const getBankDetail = (id) => {
  return request.get(`/bank/${id}`)
}

export const updateQuestion = (bankId, questionId, data) => {
  return request.put(`/bank/${bankId}/question/${questionId}`, data)
}

export const deleteBank = (id) => {
  return request.delete(`/bank/${id}`)
}

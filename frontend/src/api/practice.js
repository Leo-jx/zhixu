import request from '@/utils/request'

export const startPractice = (bankId, mode) => {
  return request.post('/practice/start', { bankId, mode })
}

export const submitAnswer = (recordId, questionId, userAnswer, isMarked) => {
  return request.post('/practice/submit', { recordId, questionId, userAnswer, isMarked })
}

export const getRecord = (recordId) => {
  return request.get(`/practice/record/${recordId}`)
}

export const endPractice = (recordId) => {
  return request.post('/practice/end', { recordId })
}

export const getWrongQuestions = (params) => {
  return request.get('/practice/wrong-questions', { params })
}

export const removeWrongQuestion = (questionId) => {
  return request.delete(`/practice/wrong-questions/${questionId}`)
}

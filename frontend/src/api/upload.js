import request from '@/utils/request'

export const uploadWord = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post('/upload/word', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        onProgress(percent)
      }
    }
  })
}

export const uploadWordGuest = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post('/upload/word/guest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        onProgress(percent)
      }
    }
  })
}

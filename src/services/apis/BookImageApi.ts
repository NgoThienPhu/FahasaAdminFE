import apiClient, { type APIPaginationSuccessResponse, type APISuccessResponse } from './config'
import type { BookImage } from '../entities/BookImage'

const bookImageApi = {
  getBookPrimaryImage(bookId: string): Promise<APIPaginationSuccessResponse<BookImage>> {
    return apiClient.get(`/books/${bookId}/images/primary`)
  },

  getBookSecondaryImages(bookId: string): Promise<APIPaginationSuccessResponse<BookImage>> {
    return apiClient.get(`/books/${bookId}/images/secondary`)
  },

  uploadBookPrimaryImage(bookId: string, image: File): Promise<APISuccessResponse<BookImage>> {
    const formData = new FormData()
    formData.append('file', image)
    return apiClient.put(`/books/${bookId}/images/primary`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default bookImageApi

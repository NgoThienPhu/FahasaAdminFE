import type { Book } from '../entities/Book'
import apiClient, { type APIPaginationSuccessResponse, type APISuccessResponse } from './config'

interface GetBooksParams {
  page: number
  pageSize: number
  orderBy: 'ASC' | 'DESC'
  sortBy: 'title' | 'author' | 'publisher' | 'createdAt'
  search?: string
}

interface CreateBookParams {
  title: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
  price: number
}

interface UpdateBookParams {
  title: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
}

const bookApi = {
  getBooks(params: GetBooksParams): Promise<APIPaginationSuccessResponse<Book[]>> {
    const search = params.search?.trim()
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    return apiClient.get(
      `/books?page=${params.page}&size=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}${searchParam}`
    )
  },

  findBookById(id: string): Promise<APISuccessResponse<Book>> {
    return apiClient.get(`/books/${id}`)
  },

  createBook(params: CreateBookParams): Promise<APISuccessResponse<Book>> {
    return apiClient.post('/books', params)
  },

  updateBook(id: string, params: UpdateBookParams): Promise<APISuccessResponse<Book>> {
    return apiClient.put(`/books/${id}`, params)
  },
}

export default bookApi
export type { GetBooksParams, CreateBookParams, UpdateBookParams }

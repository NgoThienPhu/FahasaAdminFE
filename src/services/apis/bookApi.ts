import apiClient, { type APIPaginationSuccessResponse } from './config'

export interface CategoryRef {
  id: string
  name: string
}

export interface BookPriceRef {
  id: string
  listPrice: number
  salePrice: number
  effectiveFrom?: string
  effectiveTo?: string
}

export interface BookImageRef {
  id: string
  url?: string
  imageUrl?: string
}

export interface Book {
  id: string
  title: string
  description?: string
  author: string
  publisher?: string
  isbn: string
  category?: CategoryRef
  categoryName?: string
  publishDate?: string
  bookPrices?: BookPriceRef[]
  bookImages?: BookImageRef[]
  createdAt?: string
}

export interface GetBooksParams {
  page: number
  pageSize: number
  orderBy?: 'ASC' | 'DESC'
  sortBy?: 'title' | 'author' | 'createdAt'
  search?: string
}

const bookApi = {
  getBooks(params: GetBooksParams): Promise<APIPaginationSuccessResponse<Book[]>> {
    const search = params.search?.trim()
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    const sortBy = params.sortBy ?? 'createdAt'
    const orderBy = params.orderBy ?? 'DESC'
    return apiClient.get(
      `/books?page=${params.page}&pageSize=${params.pageSize}&orderBy=${orderBy}&sortBy=${sortBy}${searchParam}`
    )
  },
}

export default bookApi

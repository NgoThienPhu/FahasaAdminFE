import type { Book } from '../entities/Book';
import apiClient, { type APIPaginationSuccessResponse, type APISuccessResponse } from './config'

interface CreateBookParams extends UpdateBookParams {
    price: number;
}

interface UpdateBookParams {
    title: string;
    description: string;
    author: string;
    publisher: string;
    isbn: string;
    categoryId: string;
    publishDate: string;
}

interface GetBooksParams {
    search?: string;
    page: number;
    pageSize: number;
    orderBy: "ASC" | "DESC";
    sortBy: "title" | "author" | "publisher" | "isbn" | "category" | "publishDate" | "createdAt";
}

const bookApi = {

    getBooks(params: GetBooksParams): Promise<APIPaginationSuccessResponse<Book[]>> {
        const search = params.search?.trim()
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
        return apiClient.get(
            `/books?page=${params.page}&pageSize=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}${searchParam}`
        )
    },

    createBook(params: CreateBookParams): Promise<APISuccessResponse<Book>> {
        return apiClient.post('/books', params)
    },

    findBookById(id: string): Promise<APISuccessResponse<Book>> {
        return apiClient.get(`/books/${id}`)
    },

    updateBook(id: string, params: UpdateBookParams): Promise<APISuccessResponse<Book>> {
        return apiClient.put(`/books/${id}`, params)
    },

}

export default bookApi

// Dữ liệu và helper dùng chung cho Products & BookDetail

export type BookPriceRef = {
  id: string
  listPrice: number
  salePrice: number
  effectiveFrom?: string
  effectiveTo?: string
}

export type Book = {
  id: string
  title: string
  author: string
  isbn: string
  categoryName?: string
  category?: { name?: string }
  createdAt: string
  bookPrices?: BookPriceRef[]
  /** URL ảnh bìa; nếu không có sẽ hiển thị ảnh mặc định */
  coverImageUrl?: string
  /** Danh sách URL ảnh phụ (data URL hoặc URL) */
  extraImageUrls?: string[]
  description?: string
  publisher?: string
  publishDate?: string
}

export const MOCK_CATEGORIES: { id: string; name: string }[] = [
  { id: 'cat-1', name: 'Kỹ năng sống' },
  { id: 'cat-2', name: 'Văn học' },
  { id: 'cat-3', name: 'Kinh doanh' },
  { id: 'cat-4', name: 'Lịch sử - Khảo cứu' },
  { id: 'cat-5', name: 'Thiếu nhi' },
  { id: 'cat-6', name: 'Giáo dục' },
  { id: 'cat-7', name: 'Công nghệ' },
]

export function getCategoryName(book: Book): string {
  return book.categoryName ?? book.category?.name ?? '—'
}

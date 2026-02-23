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

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    isbn: '978-604-1-00001-1',
    categoryName: 'Kỹ năng sống',
    createdAt: '2024-01-15T08:30:00.000Z',
    bookPrices: [{ id: 'p1', listPrice: 89000, salePrice: 71000 }],
  },
  {
    id: '2',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    isbn: '978-604-1-00002-2',
    categoryName: 'Văn học',
    createdAt: '2024-02-20T10:00:00.000Z',
    bookPrices: [{ id: 'p2', listPrice: 75000, salePrice: 60000 }],
  },
  {
    id: '3',
    title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
    author: 'Rosie Nguyễn',
    isbn: '978-604-1-00003-3',
    categoryName: 'Kỹ năng sống',
    createdAt: '2024-03-10T14:15:00.000Z',
    bookPrices: [{ id: 'p3', listPrice: 69000, salePrice: 55200 }],
  },
  {
    id: '4',
    title: 'Sapiens: Lược Sử Loài Người',
    author: 'Yuval Noah Harari',
    isbn: '978-604-1-00004-4',
    categoryName: 'Lịch sử - Khảo cứu',
    createdAt: '2024-04-05T09:45:00.000Z',
    bookPrices: [{ id: 'p4', listPrice: 199000, salePrice: 159200 }],
  },
  {
    id: '5',
    title: 'Cà Phê Cùng Tony – Trên Đường Băng (Tái Bản)',
    author: 'Tony Buổi Sáng',
    isbn: '978-604-1-00005-5',
    categoryName: 'Kinh doanh',
    createdAt: '2024-05-12T11:20:00.000Z',
    bookPrices: [{ id: 'p5', listPrice: 88000, salePrice: 70400 }],
  },
]

/** Ảnh bìa mặc định khi sách chưa có ảnh */
export const DEFAULT_BOOK_COVER =
  'https://placehold.co/240x320/e2e8f0/64748b?text=Ch%C6%B0a+c%C3%B3+%E1%BA%A3nh'

export function getBookById(id: string): Book | undefined {
  return MOCK_BOOKS.find((b) => b.id === id)
}

export function getCategoryName(book: Book): string {
  return book.categoryName ?? book.category?.name ?? '—'
}

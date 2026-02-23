import { useState, useMemo } from 'react'
import {
  FiPackage,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi'
import { useNotification } from '../../contexts/NotificationContext'
import styles from './Products.module.css'

const PAGE_SIZE = 10

// --- Types ---
type BookPriceRef = {
  id: string
  listPrice: number
  salePrice: number
  effectiveFrom?: string
  effectiveTo?: string
}

type Book = {
  id: string
  title: string
  author: string
  isbn: string
  categoryName?: string
  category?: { name?: string }
  createdAt: string
  bookPrices?: BookPriceRef[]
}

type SortField = 'title' | 'author' | 'createdAt'
type SortOrder = 'asc' | 'desc'

// --- Data mẫu ---
const MOCK_BOOKS: Book[] = [
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

// --- Helpers: giá & định dạng ---
function getCurrentPrice(prices?: BookPriceRef[]): number | null {
  if (!prices?.length) return null
  const now = new Date().toISOString()
  const active = prices.find((p) => {
    const from = p.effectiveFrom ?? ''
    const to = p.effectiveTo ?? '9999'
    return from <= now && now < to
  })
  const price = active ?? prices[prices.length - 1]
  return price?.salePrice ?? price?.listPrice ?? null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCategoryName(book: Book): string {
  return book.categoryName ?? book.category?.name ?? '—'
}

// --- Helpers: lọc & sắp xếp (dùng cho danh sách nội bộ) ---
function filterBooksByKeyword(books: Book[], keyword: string): Book[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return [...books]
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(kw) ||
      b.author.toLowerCase().includes(kw) ||
      b.isbn.toLowerCase().includes(kw)
  )
}

function sortBooks(books: Book[], sortField: SortField, sortOrder: SortOrder): Book[] {
  const getValue = (b: Book): string => {
    if (sortField === 'title') return b.title
    if (sortField === 'author') return b.author
    return b.createdAt ?? ''
  }
  const sorted = [...books].sort((a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    if (va < vb) return sortOrder === 'asc' ? -1 : 1
    if (va > vb) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

// --- Component: cột header có nút sắp xếp ---
function ThSort({
  field,
  label,
  className,
  currentField,
  currentOrder,
  onSort,
}: {
  field: SortField
  label: string
  className?: string
  currentField: SortField
  currentOrder: SortOrder
  onSort: (field: SortField) => void
}) {
  const isActive = currentField === field
  return (
    <th className={className}>
      <button
        type="button"
        className={styles.thSortBtn}
        onClick={() => onSort(field)}
      >
        <span>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? (
            <FiChevronUp className={styles.sortIconActive} aria-hidden />
          ) : (
            <FiChevronDown className={styles.sortIconActive} aria-hidden />
          )
        ) : (
          <span className={styles.sortIconHint}>
            <FiChevronUp className={styles.sortChevron} aria-hidden />
            <FiChevronDown className={styles.sortChevron} aria-hidden />
          </span>
        )}
      </button>
    </th>
  )
}

function Products() {
  const { addNotification } = useNotification()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Danh sách sau khi lọc + sắp xếp + phân trang
  const { list, totalItems, totalPages, displayPage, from, to } = useMemo(() => {
    const filtered = filterBooksByKeyword(MOCK_BOOKS, searchKeyword)
    const sorted = sortBooks(filtered, sortField, sortOrder)

    const totalItems = sorted.length
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0
    const displayPage = Math.min(Math.max(1, currentPage), totalPages || 1)
    const start = (displayPage - 1) * PAGE_SIZE
    const list = sorted.slice(start, start + PAGE_SIZE)

    const from = totalItems === 0 ? 0 : start + 1
    const to = Math.min(start + PAGE_SIZE, totalItems)

    return { list, totalItems, totalPages, displayPage, from, to }
  }, [currentPage, sortField, sortOrder, searchKeyword])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(searchInput.trim())
    setCurrentPage(1)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FiPackage aria-hidden /> Quản lý Sách
        </h1>
        <p className={styles.description}>
          Danh sách sách trong hệ thống. Tìm kiếm theo tên sách, tác giả, ISBN.
        </p>
      </header>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={handleSearch} role="search">
            <span className={styles.searchIcon} aria-hidden>
              <FiSearch />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm theo tên sách, tác giả, ISBN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm sách"
            />
            <button type="submit" className={styles.searchBtn}>
              Tìm kiếm
            </button>
          </form>
        </div>

        <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thStt}>STT</th>
                  <ThSort
                    field="title"
                    label="Tên sách"
                    className={styles.thTitle}
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className={styles.thAuthor}>Tác giả</th>
                  <th className={styles.thIsbn}>ISBN</th>
                  <th className={styles.thCategory}>Danh mục</th>
                  <th className={styles.thPrice}>Giá hiện tại</th>
                  <ThSort
                    field="createdAt"
                    label="Ngày tạo"
                    className={styles.thCreatedAt}
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className={styles.thAction}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((book, index) => {
                  const stt = (displayPage - 1) * PAGE_SIZE + index + 1
                  const price = getCurrentPrice(book.bookPrices)
                  return (
                    <tr key={book.id}>
                      <td className={styles.tdStt}>{stt}</td>
                      <td className={styles.tdTitle} title={book.title}>
                        {book.title}
                      </td>
                      <td className={styles.tdAuthor} title={book.author}>{book.author}</td>
                      <td className={styles.tdIsbn} title={book.isbn}>{book.isbn}</td>
                      <td className={styles.tdCategory} title={getCategoryName(book)}>
                        {getCategoryName(book)}
                      </td>
                      <td className={styles.tdPrice}>
                        {price != null ? formatCurrency(price) : '—'}
                      </td>
                      <td className={styles.tdCreatedAt} title={book.createdAt ? formatDateTime(book.createdAt) : undefined}>
                        {formatDateTime(book.createdAt)}
                      </td>
                      <td className={styles.tdAction}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.btnAction}
                            title="Xem chi tiết"
                            aria-label={`Xem chi tiết ${book.title}`}
                          >
                            <FiEye aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            title="Cập nhật"
                            aria-label={`Cập nhật ${book.title}`}
                            onClick={() => addNotification('info', `Cập nhật sách: ${book.title} – API sẽ bổ sung.`)}
                          >
                            <FiEdit2 aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            title="Xóa"
                            aria-label={`Xóa ${book.title}`}
                            onClick={() => addNotification('info', `Xóa sách: ${book.title} – API sẽ bổ sung.`)}
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        </div>

        <div className={styles.pagination}>
          <p className={styles.paginationInfo}>
            Hiển thị {from}–{to} trong tổng số {totalItems} sách
          </p>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={displayPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              aria-label="Trang trước"
            >
              <FiChevronLeft aria-hidden />
            </button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={displayPage === p ? styles.pageBtnActive : styles.pageBtn}
                  onClick={() => setCurrentPage(p)}
                  aria-label={`Trang ${p}`}
                  aria-current={displayPage === p ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={displayPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="Trang sau"
            >
              <FiChevronRight aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products

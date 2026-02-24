import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiPackage,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiEye,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { useNotification } from '../../contexts/NotificationContext'
import type { Book } from '../../services/entities/Book'
import type { Category } from '../../services/entities/Category'
import bookApi from '../../services/apis/BookApi'
import categoryApi from '../../services/apis/categoryApi'
import styles from './Products.module.css'

const PAGE_SIZE = 10

// --- Types (local) ---
type SortField = 'title' | 'author' | 'publisher' | 'category' | 'createdAt'
type SortOrder = 'asc' | 'desc'

/** Form tạo sách (theo CreateBookRequestDTO) */
type CreateBookFormData = {
  title: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
  price: string
}

const INIT_CREATE_FORM: CreateBookFormData = {
  title: '',
  description: '',
  author: '',
  publisher: '',
  isbn: '',
  categoryId: '',
  publishDate: '',
  price: '',
}

// --- Helpers: định dạng ---
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
  return book.category?.name ?? '—'
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
    if (sortField === 'title') return b.title ?? ''
    if (sortField === 'author') return b.author ?? ''
    if (sortField === 'publisher') return b.publisher?.trim() ?? ''
    if (sortField === 'category') return getCategoryName(b)
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
  const navigate = useNavigate()
  const { addNotification } = useNotification()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [remoteBooks, setRemoteBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateBookFormData>(INIT_CREATE_FORM)
  const [createFormErrors, setCreateFormErrors] = useState<
    Partial<Record<keyof CreateBookFormData, string>>
  >({})
  const [createSubmitting, setCreateSubmitting] = useState(false)

  useEffect(() => {
    bookApi
      .getBooks({
        page: 0,
        pageSize: 1000,
        orderBy: 'DESC',
        sortBy: 'createdAt',
      })
      .then((res: { data?: unknown }) => {
        const raw = (res.data ?? []) as Array<Record<string, unknown>>
        const mapped = raw.map((b) => {
          const anyBook = b as any
          const createdAt = anyBook.createdAt ?? anyBook.created_at ?? ''
          return { ...anyBook, createdAt } as Book
        })
        setRemoteBooks(mapped)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Không thể tải danh sách sách.'
        addNotification('error', msg)
        setRemoteBooks([])
      })
  }, [addNotification])

  useEffect(() => {
    categoryApi
      .getCategories({
        page: 0,
        pageSize: 1000,
        orderBy: 'ASC',
        sortBy: 'name',
      })
      .then((res: { data?: unknown }) => {
        const data = (res.data ?? []) as Category[]
        setCategories(data)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Không thể tải danh mục sách.'
        addNotification('error', msg)
        setCategories([])
      })
  }, [addNotification])

  // Danh sách sau khi lọc + sắp xếp + phân trang (trên dữ liệu remoteBooks)
  const { list, totalItems, totalPages, displayPage, from, to } = useMemo(() => {
    const filtered = filterBooksByKeyword(remoteBooks, searchKeyword)
    const sorted = sortBooks(filtered, sortField, sortOrder)

    const totalItems = sorted.length
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0
    const displayPage = Math.min(Math.max(1, currentPage), totalPages || 1)
    const start = (displayPage - 1) * PAGE_SIZE
    const list = sorted.slice(start, start + PAGE_SIZE)

    const from = totalItems === 0 ? 0 : start + 1
    const to = Math.min(start + PAGE_SIZE, totalItems)

    return { list, totalItems, totalPages, displayPage, from, to }
  }, [currentPage, sortField, sortOrder, searchKeyword, remoteBooks])

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

  const validateCreateForm = (data: CreateBookFormData): Partial<Record<keyof CreateBookFormData, string>> => {
    const err: Partial<Record<keyof CreateBookFormData, string>> = {}
    if (!data.title?.trim()) err.title = 'Tiêu đề sách không được để trống'
    if (!data.description?.trim()) err.description = 'Mô tả sách không được để trống'
    if (!data.author?.trim()) err.author = 'Tên tác giả không được để trống'
    if (!data.publisher?.trim()) err.publisher = 'Tên nhà cung cấp không được để trống'
    if (!data.isbn?.trim()) err.isbn = 'ISBN không được để trống'
    if (!data.categoryId?.trim()) err.categoryId = 'Loại sản phẩm không được để trống'
    if (!data.publishDate?.trim()) err.publishDate = 'Ngày phát hành không được để trống'
    else {
      const d = new Date(data.publishDate)
      if (d > new Date()) err.publishDate = 'Ngày phát hành phải bằng hoặc trong quá khứ'
    }
    const priceNum = Number(data.price?.replace(/\s/g, ''))
    if (data.price === '' || Number.isNaN(priceNum)) err.price = 'Giá không hợp lệ'
    else if (priceNum < 1000) err.price = 'Giá tối thiểu là 1.000 VND'
    return err
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateCreateForm(createForm)
    setCreateFormErrors(err)
    if (Object.keys(err).length > 0) return
    setCreateSubmitting(true)
    const priceNum = Number(createForm.price.replace(/\s/g, ''))

    bookApi
      .createBook({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        author: createForm.author.trim(),
        publisher: createForm.publisher.trim(),
        isbn: createForm.isbn.trim(),
        categoryId: createForm.categoryId,
        publishDate: createForm.publishDate,
        price: priceNum,
      })
      .then((res) => {
        const created = res.data as Book
        setRemoteBooks((prev) => [created, ...prev])
        setCreateForm(INIT_CREATE_FORM)
        setCreateFormErrors({})
        setShowCreateModal(false)
        addNotification('success', `Đã thêm sách "${created.title}".`)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Thêm sách thất bại.'
        addNotification('error', msg)
      })
      .finally(() => {
        setCreateSubmitting(false)
      })
  }

  const openCreateModal = () => {
    setCreateForm(INIT_CREATE_FORM)
    setCreateFormErrors({})
    setShowCreateModal(true)
  }

  const clearCreateFormError = (field: keyof CreateBookFormData) => {
    setCreateFormErrors((prev) => ({ ...prev, [field]: undefined }))
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
          <button
            type="button"
            className={styles.btnAdd}
            onClick={openCreateModal}
            aria-label="Thêm sách mới"
          >
            <FiPlus aria-hidden /> Thêm sách
          </button>
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
                  <ThSort
                    field="author"
                    label="Tác giả"
                    className={styles.thAuthor}
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className={styles.thIsbn}>ISBN</th>
                  <ThSort
                    field="category"
                    label="Danh mục"
                    className={styles.thCategory}
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <ThSort
                    field="publisher"
                    label="Nhà cung cấp"
                    className={styles.thPublisher}
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
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
                      <td className={styles.tdPublisher} title={book.publisher ?? undefined}>
                        {book.publisher?.trim() || '—'}
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
                            onClick={() => navigate(`/products/${book.id}`, { state: { book } })}
                          >
                            <FiEye aria-hidden />
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

      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !createSubmitting && setShowCreateModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-book-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="create-book-title" className={styles.modalTitle}>
                Thêm sách mới
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => !createSubmitting && setShowCreateModal(false)}
                aria-label="Đóng"
              >
                <FiX aria-hidden />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className={styles.form}>
              <div className={styles.formBody}>
                <div className={styles.field}>
                  <label htmlFor="create-title" className={styles.label}>
                    Tiêu đề sách <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-title"
                    type="text"
                    className={styles.input}
                    value={createForm.title}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                    clearCreateFormError('title')
                  }}
                    placeholder="Nhập tiêu đề"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.title && (
                    <span className={styles.fieldError}>{createFormErrors.title}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-description" className={styles.label}>
                    Mô tả <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="create-description"
                    className={styles.textarea}
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, description: e.target.value }))
                    clearCreateFormError('description')
                  }}
                    placeholder="Nhập mô tả"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.description && (
                    <span className={styles.fieldError}>{createFormErrors.description}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-author" className={styles.label}>
                    Tác giả <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-author"
                    type="text"
                    className={styles.input}
                    value={createForm.author}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, author: e.target.value }))
                    clearCreateFormError('author')
                  }}
                    placeholder="Nhập tên tác giả"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.author && (
                    <span className={styles.fieldError}>{createFormErrors.author}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-publisher" className={styles.label}>
                    Nhà cung cấp <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-publisher"
                    type="text"
                    className={styles.input}
                    value={createForm.publisher}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, publisher: e.target.value }))
                    clearCreateFormError('publisher')
                  }}
                    placeholder="Nhập tên nhà cung cấp"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.publisher && (
                    <span className={styles.fieldError}>{createFormErrors.publisher}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-isbn" className={styles.label}>
                    ISBN <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-isbn"
                    type="text"
                    className={styles.input}
                    value={createForm.isbn}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, isbn: e.target.value }))
                    clearCreateFormError('isbn')
                  }}
                    placeholder="VD: 978-604-1-00001-1"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.isbn && (
                    <span className={styles.fieldError}>{createFormErrors.isbn}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-categoryId" className={styles.label}>
                    Loại sản phẩm <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="create-categoryId"
                    className={styles.select}
                    value={createForm.categoryId}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, categoryId: e.target.value }))
                    clearCreateFormError('categoryId')
                  }}
                    disabled={createSubmitting}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {createFormErrors.categoryId && (
                    <span className={styles.fieldError}>{createFormErrors.categoryId}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-publishDate" className={styles.label}>
                    Ngày phát hành <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-publishDate"
                    type="date"
                    className={styles.input}
                    value={createForm.publishDate}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, publishDate: e.target.value }))
                    clearCreateFormError('publishDate')
                  }}
                    disabled={createSubmitting}
                  />
                  {createFormErrors.publishDate && (
                    <span className={styles.fieldError}>{createFormErrors.publishDate}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-price" className={styles.label}>
                    Giá (VND) <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="create-price"
                    type="number"
                    min={1000}
                    step={1000}
                    className={styles.input}
                    value={createForm.price}
                    onChange={(e) => {
                    setCreateForm((f) => ({ ...f, price: e.target.value }))
                    clearCreateFormError('price')
                  }}
                    placeholder="Tối thiểu 1.000"
                    disabled={createSubmitting}
                  />
                  {createFormErrors.price && (
                    <span className={styles.fieldError}>{createFormErrors.price}</span>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={createSubmitting}>
                  {createSubmitting ? 'Đang lưu…' : 'Thêm sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products

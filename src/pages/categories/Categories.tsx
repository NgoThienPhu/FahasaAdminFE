import { useEffect, useMemo, useState } from 'react'
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { useNotification } from '../../contexts/NotificationContext'
import Loading from '../../components/Loading/Loading'
import type { Category } from '../../services/entities/Category'
import categoryApi from '../../services/apis/categoryApi'
import styles from '../products/Products.module.css'

const PAGE_SIZE = 10

type SortField = 'name' | 'createdAt'
type SortOrder = 'asc' | 'desc'

interface CategoryListItem extends Category {}

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

type ThSortProps = {
  field: SortField
  label: string
  className?: string
  currentField: SortField
  currentOrder: SortOrder
  onSort: (field: SortField) => void
}

function ThSort({ field, label, className, currentField, currentOrder, onSort }: ThSortProps) {
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

function sortCategories(list: CategoryListItem[], sortField: SortField, sortOrder: SortOrder) {
  const getValue = (c: CategoryListItem): string => {
    if (sortField === 'name') return c.name ?? ''
    return c.createdAt ?? ''
  }
  const sorted = [...list].sort((a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    if (va < vb) return sortOrder === 'asc' ? -1 : 1
    if (va > vb) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

function Categories() {
  const { addNotification } = useNotification()

  const [list, setList] = useState<CategoryListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CategoryListItem | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const displayPage = Math.min(Math.max(1, currentPage), totalPages || 1)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(searchInput.trim())
    setCurrentPage(1)
  }

  const refreshList = () => {
    setLoading(true)
    return categoryApi
      .getCategories({
        page: displayPage - 1,
        pageSize: PAGE_SIZE,
        orderBy: sortOrder === 'asc' ? 'ASC' : 'DESC',
        sortBy: sortField,
        search: searchKeyword || undefined,
      })
      .then((res: { data?: unknown; pagination?: { totalItems?: number; totalPages?: number } }) => {
        const data = (res.data ?? []) as CategoryListItem[]
        setList(data)
        const p = res.pagination
        setTotalItems(p?.totalItems ?? data.length)
        setTotalPages(p?.totalPages ?? (data.length ? 1 : 0))
        return data
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Không thể tải danh mục sách.'
        addNotification('error', msg)
        setList([])
        setTotalItems(0)
        setTotalPages(0)
        return []
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayPage, sortField, sortOrder, searchKeyword])

  const [from, to] = useMemo(() => {
    if (totalItems === 0) return [0, 0]
    const start = (displayPage - 1) * PAGE_SIZE + 1
    const end = Math.min(displayPage * PAGE_SIZE, totalItems)
    return [start, end]
  }, [displayPage, totalItems])

  const sortedList = useMemo(
    () => sortCategories(list, sortField, sortOrder),
    [list, sortField, sortOrder]
  )

  const openCreateModal = () => {
    setEditing(null)
    setNameInput('')
    setNameError(null)
    setShowModal(true)
  }

  const openEditModal = (item: CategoryListItem) => {
    setEditing(item)
    setNameInput(item.name ?? '')
    setNameError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (submitting) return
    setShowModal(false)
  }

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault()
    const value = nameInput.trim()
    if (!value) {
      setNameError('Tên danh mục không được để trống')
      return
    }
    setNameError(null)
    setSubmitting(true)

    const action = editing
      ? categoryApi.updateCategory(editing.id, { categoryName: value })
      : categoryApi.createCategory({ categoryName: value })

    action
      .then(() => refreshList())
      .then(() => {
        addNotification(
          'success',
          editing ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục mới.'
        )
        setShowModal(false)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Thao tác với danh mục thất bại.'
        addNotification('error', msg)
      })
      .finally(() => setSubmitting(false))
  }

  const openDeleteConfirm = (item: CategoryListItem) => {
    setDeleteTarget(item)
  }

  const closeDeleteConfirm = () => {
    if (deleting) return
    setDeleteTarget(null)
  }

  const handleConfirmDelete = () => {
    const target = deleteTarget
    if (!target) return
    setDeleting(true)
    categoryApi
      .deleteCategory(target.id)
      .then(() => refreshList())
      .then(() => {
        addNotification('success', `Đã xóa danh mục "${target.name}".`)
        setDeleteTarget(null)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Xóa danh mục thất bại.'
        addNotification('error', msg)
      })
      .finally(() => setDeleting(false))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FiTag aria-hidden /> Quản lý Danh mục sách
        </h1>
        <p className={styles.description}>
          Danh sách danh mục sách trong hệ thống. Bạn có thể thêm, sửa, xóa danh mục.
        </p>
      </header>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
            <span className={styles.searchIcon} aria-hidden>
              <FiSearch />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm theo tên danh mục..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm danh mục"
            />
            <button type="submit" className={styles.searchBtn}>
              Tìm kiếm
            </button>
          </form>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={openCreateModal}
            aria-label="Thêm danh mục mới"
          >
            <FiPlus aria-hidden /> Thêm danh mục
          </button>
        </div>

        {loading ? (
          <div className={styles.tableLoading}>
            <Loading />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thStt}>STT</th>
                    <ThSort
                      field="name"
                      label="Tên danh mục"
                      className={styles.thTitle}
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
                  {sortedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.tdEmpty} />
                    </tr>
                  ) : (
                    sortedList.map((item, index) => {
                  const stt = (displayPage - 1) * PAGE_SIZE + index + 1
                  return (
                    <tr key={item.id}>
                      <td className={styles.tdStt}>{stt}</td>
                      <td className={styles.tdTitle} title={item.name}>
                        {item.name}
                      </td>
                      <td className={styles.tdCreatedAt} title={formatDateTime(item.createdAt)}>
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className={styles.tdAction}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.btnAction}
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa danh mục ${item.name}`}
                            onClick={() => openEditModal(item)}
                          >
                            <FiEdit2 aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            title="Xóa"
                            aria-label={`Xóa danh mục ${item.name}`}
                            onClick={() => openDeleteConfirm(item)}
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
          <p className={styles.paginationInfo}>
            Hiển thị {from}–{to} trong tổng số {totalItems} danh mục
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
          </>
        )}
      </div>

      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="category-modal-title" className={styles.modalTitle}>
                {editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Đóng"
              >
                <FiX aria-hidden />
              </button>
            </div>
            <form onSubmit={handleSubmitModal} className={styles.form}>
              <div className={styles.formBody}>
                <div className={styles.field}>
                  <label htmlFor="category-name" className={styles.label}>
                    Tên danh mục <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    className={styles.input}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nhập tên danh mục"
                    disabled={submitting}
                  />
                  {nameError && <span className={styles.fieldError}>{nameError}</span>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className={styles.modalOverlay}
          onClick={closeDeleteConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalIcon} aria-hidden>
              <FiTrash2 />
            </div>
            <h2 id="delete-category-title" className={styles.confirmModalTitle}>
              Xóa danh mục?
            </h2>
            <p className={styles.confirmModalMessage}>
              Bạn có chắc muốn xóa danh mục này? Hành động không thể hoàn tác.
            </p>
            <div className={styles.confirmModalHighlight}>
              {deleteTarget.name}
            </div>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa…' : 'Xóa danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories


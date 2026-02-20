import { useState, useEffect } from 'react'
import { FiUsers, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiEye, FiUser, FiKey, FiLock, FiUnlock, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import userApi from '../../services/apis/userApi'
import type { User } from '../../services/apis/userApi'
import Loading from '../../components/Loading/Loading'
import styles from './Users.module.css'

const PAGE_SIZE = 10

type SortField = 'username' | 'fullName' | 'email' | 'phoneNumber' | 'isActived' | 'createdAt'
type SortOrder = 'asc' | 'desc'

const SORTABLE_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'username', label: 'Tên đăng nhập' },
  { field: 'fullName', label: 'Họ tên' },
  { field: 'email', label: 'Email' },
  { field: 'phoneNumber', label: 'Số điện thoại' },
  { field: 'isActived', label: 'Trạng thái' },
  { field: 'createdAt', label: 'Ngày tạo' },
]

export interface UserListItem {
  id: string
  username: string
  fullName: string
  email: { email: string; isVerify: boolean }
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth: string | null
  phoneNumber: string | null
  isActived: boolean
  createdAt: string
}

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

function mapUserFromApi(user: User): UserListItem {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    phoneNumber: user.phoneNumber?.phoneNumber ?? null,
    isActived: user.status === 'ACTIVE',
    createdAt: user.createdAt,
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Users() {
  const [currentPage, setCurrentPage] = useState(1)
  const [detailUser, setDetailUser] = useState<UserListItem | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({})
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [list, setList] = useState<UserListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    userApi
      .getUsers({
        page: currentPage - 1,
        pageSize: PAGE_SIZE,
        orderBy: sortOrder === 'asc' ? 'ASC' : 'DESC',
        sortBy: sortField,
      })
      .then((res) => {
        const r = res as unknown as Record<string, unknown>
        const rawList = (res.data ?? r.content ?? []) as User[]
        setList(rawList.map(mapUserFromApi))
        const p = (r.pagination ?? r) as Record<string, unknown>
        const total =
          Number(p.totalItems) ||
          Number(p.totalElements) ||
          Number(p.total_items) ||
          Number(r.totalElements) ||
          0
        const pages =
          Number(p.totalPages) ||
          Number(p.total_pages) ||
          Number(r.totalPages) ||
          (total > 0 ? Math.ceil(total / PAGE_SIZE) : 0)
        setTotalItems(total)
        setTotalPages(pages)
      })
      .catch((err) => {
        setError(err?.message ?? 'Không thể tải danh sách người dùng.')
        setList([])
      })
      .finally(() => setLoading(false))
  }, [currentPage, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const getEffectiveStatus = (user: UserListItem) => statusOverrides[user.id] ?? user.isActived

  const handleToggleStatus = (user: UserListItem) => {
    const next = !getEffectiveStatus(user)
    setStatusOverrides((prev) => ({ ...prev, [user.id]: next }))
    // TODO: Gọi API cập nhật trạng thái (khóa/mở khóa)
  }

  const handleResetPassword = (user: UserListItem) => {
    // TODO: Gọi API reset password hoặc mở modal nhập mật khẩu mới
    alert(`Reset mật khẩu cho ${user.username} – tích hợp API sau.`)
  }

  const displayPage = Math.min(Math.max(1, currentPage), totalPages || 1)
  const from = totalItems === 0 ? 0 : (displayPage - 1) * PAGE_SIZE + 1
  const to = Math.min(displayPage * PAGE_SIZE, totalItems)
  const paginatedUsers = list

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FiUsers aria-hidden /> Quản lý Người dùng
        </h1>
        <p className={styles.description}>
          Danh sách tài khoản người dùng trong hệ thống.
        </p>
      </header>

      <div className={styles.card}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className={styles.tableLoading}>
            <Loading />
          </div>
        ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thId}>STT</th>
                {SORTABLE_COLUMNS.map(({ field, label }) => (
                  <th
                    key={field}
                    className={
                      field === 'username'
                        ? styles.thUsername
                        : field === 'fullName'
                          ? styles.thFullName
                          : field === 'email'
                            ? styles.thEmail
                            : field === 'phoneNumber'
                              ? styles.thPhone
                              : field === 'isActived'
                                ? styles.thStatus
                                : field === 'createdAt'
                                  ? styles.thCreatedAt
                                  : undefined
                    }
                  >
                    <button
                      type="button"
                      className={styles.thSortBtn}
                      onClick={() => handleSort(field)}
                    >
                      <span>{label}</span>
                      {sortField === field ? (
                        sortOrder === 'asc' ? (
                          <FiChevronUp className={styles.sortIconActive} aria-hidden />
                        ) : (
                          <FiChevronDown className={styles.sortIconActive} aria-hidden />
                        )
                      ) : (
                        <span className={styles.sortIconHint} aria-label="Có thể sắp xếp">
                          <FiChevronUp className={styles.sortChevron} aria-hidden />
                          <FiChevronDown className={styles.sortChevron} aria-hidden />
                        </span>
                      )}
                    </button>
                  </th>
                ))}
                <th className={styles.thAction}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => {
                const effectiveStatus = getEffectiveStatus(user)
                const stt = (displayPage - 1) * PAGE_SIZE + index + 1
                return (
                  <tr key={user.id}>
                    <td className={styles.tdId}>{stt}</td>
                    <td className={styles.tdUsername}>{user.username}</td>
                    <td className={styles.tdFullName} title={user.fullName}>{user.fullName}</td>
                    <td className={styles.tdEmail} title={user.email.email}>
                      <span className={styles.email}>{user.email.email}</span>
                    </td>
                    <td>{user.phoneNumber ?? '—'}</td>
                    <td className={styles.tdStatus}>
                      {!effectiveStatus ? (
                        <span className={styles.statusActive}>
                          <FiCheck aria-hidden /> Hoạt động
                        </span>
                      ) : (
                        <span className={styles.statusInactive}>
                          <FiX aria-hidden /> Khóa
                        </span>
                      )}
                    </td>
                    <td className={styles.tdCreatedAt}>{formatDateTime(user.createdAt)}</td>
                    <td className={styles.tdAction}>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => setDetailUser(user)}
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${user.fullName}`}
                        >
                          <FiEye aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => handleResetPassword(user)}
                          title="Reset mật khẩu"
                          aria-label={`Reset mật khẩu ${user.username}`}
                        >
                          <FiKey aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => handleToggleStatus(user)}
                          title={effectiveStatus ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          aria-label={effectiveStatus ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {effectiveStatus ? <FiLock aria-hidden /> : <FiUnlock aria-hidden />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}

        <div className={styles.pagination}>
          <p className={styles.paginationInfo}>
            Hiển thị {from}–{to} trong tổng số {totalItems} người dùng
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

      {detailUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setDetailUser(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="user-detail-title" className={styles.modalTitle}>
                <FiUser aria-hidden /> Chi tiết người dùng
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDetailUser(null)}
                aria-label="Đóng"
              >
                <FiX aria-hidden />
              </button>
            </div>
            <div className={styles.modalBody}>
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt>Tên đăng nhập</dt>
                  <dd>{detailUser.username}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Họ tên</dt>
                  <dd>{detailUser.fullName}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Email</dt>
                  <dd>{detailUser.email.email}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Giới tính</dt>
                  <dd>{GENDER_LABEL[detailUser.gender] ?? detailUser.gender}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Ngày sinh</dt>
                  <dd>{formatDate(detailUser.dateOfBirth)}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Số điện thoại</dt>
                  <dd>{detailUser.phoneNumber ?? '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Trạng thái</dt>
                  <dd>
                    {detailUser.isActived ? (
                      <span className={styles.statusActive}>
                        <FiCheck aria-hidden /> Hoạt động
                      </span>
                    ) : (
                      <span className={styles.statusInactive}>
                        <FiX aria-hidden /> Khóa
                      </span>
                    )}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Ngày tạo</dt>
                  <dd>{formatDateTime(detailUser.createdAt)}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setDetailUser(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

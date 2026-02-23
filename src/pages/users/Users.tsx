import { useState, useEffect } from 'react'
import {
  FiUsers,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiUser,
  FiKey,
  FiLock,
  FiUnlock,
  FiChevronUp,
  FiChevronDown,
  FiMail,
  FiCalendar,
  FiSearch,
} from 'react-icons/fi'
import userApi from '../../services/apis/userApi'
import type { User } from '../../services/apis/userApi'
import Loading from '../../components/Loading/Loading'
import { useNotification } from '../../contexts/NotificationContext'
import styles from './Users.module.css'

const PAGE_SIZE = 10

// --- Types ---
type SortField = 'username' | 'fullName' | 'email' | 'phoneNumber' | 'isActived' | 'createdAt'
type SortOrder = 'asc' | 'desc'

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

// --- Constants ---
const SORTABLE_COLUMNS: { field: SortField; label: string }[] = [
  { field: 'username', label: 'Tên đăng nhập' },
  { field: 'fullName', label: 'Họ tên' },
  { field: 'email', label: 'Email' },
  { field: 'phoneNumber', label: 'Số điện thoại' },
  { field: 'isActived', label: 'Trạng thái' },
  { field: 'createdAt', label: 'Ngày tạo' },
]

const TH_CLASS_BY_FIELD: Record<SortField, string> = {
  username: styles.thUsername,
  fullName: styles.thFullName,
  email: styles.thEmail,
  phoneNumber: styles.thPhone,
  isActived: styles.thStatus,
  createdAt: styles.thCreatedAt,
}

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

// --- Helpers: map API & format ---
function mapUserFromApi(user: User): UserListItem {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    phoneNumber: user.phoneNumber?.phoneNumber ?? null,
    isActived: user.isActived,
    createdAt: user.createdAt,
  }
}

function parseUserListResponse(res: unknown): {
  list: UserListItem[]
  totalItems: number
  totalPages: number
} {
  const r = res as Record<string, unknown>
  const rawList = (r.data ?? r.content ?? []) as User[]
  const list = rawList.map(mapUserFromApi)
  const p = (r.pagination ?? r) as Record<string, unknown>
  const totalItems =
    Number(p.totalItems) ??
    Number(p.totalElements) ??
    Number(p.total_items) ??
    Number(r.totalElements) ??
    0
  const totalPages =
    Number(p.totalPages) ??
    Number(p.total_pages) ??
    Number(r.totalPages) ??
    (totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 0)
  return { list, totalItems, totalPages }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
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
      <button type="button" className={styles.thSortBtn} onClick={() => onSort(field)}>
        <span>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? (
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
  )
}

function Users() {
  const { addNotification } = useNotification()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [list, setList] = useState<UserListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [detailUser, setDetailUser] = useState<UserListItem | null>(null)
  const [resetConfirmUser, setResetConfirmUser] = useState<UserListItem | null>(null)
  const [resetConfirmLoading, setResetConfirmLoading] = useState(false)
  const [lockConfirm, setLockConfirm] = useState<{ user: UserListItem; action: 'lock' | 'unlock' } | null>(null)
  const [lockConfirmLoading, setLockConfirmLoading] = useState(false)

  const fetchList = () => {
    return userApi
      .getUsers({
        page: currentPage - 1,
        pageSize: PAGE_SIZE,
        orderBy: sortOrder === 'asc' ? 'ASC' : 'DESC',
        sortBy: sortField,
        search: searchKeyword || undefined,
      })
      .then((res) => {
        const { list: newList, totalItems: total, totalPages: pages } = parseUserListResponse(res)
        setList(newList)
        setTotalItems(total)
        setTotalPages(pages)
        return newList
      })
  }

  useEffect(() => {
    setLoading(true)
    fetchList()
      .catch(() => {
        addNotification('error', 'Không thể tải danh sách người dùng.')
        setList([])
      })
      .finally(() => setLoading(false))
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

  const displayPage = Math.min(Math.max(1, currentPage), totalPages || 1)
  const from = totalItems === 0 ? 0 : (displayPage - 1) * PAGE_SIZE + 1
  const to = Math.min(displayPage * PAGE_SIZE, totalItems)

  const openLockConfirm = (user: UserListItem) => {
    setLockConfirm({ user, action: user.isActived ? 'lock' : 'unlock' })
  }

  const closeLockConfirm = () => {
    if (!lockConfirmLoading) setLockConfirm(null)
  }

  const handleConfirmLockUnlock = () => {
    if (!lockConfirm) return
    const { user, action } = lockConfirm
    const isUnlock = action === 'unlock'
    setLockConfirmLoading(true)
    const apiCall = isUnlock ? userApi.unlockUser(user.id) : userApi.lockUser(user.id)
    apiCall
      .then(() => fetchList())
      .then((newList) => {
        setLockConfirm(null)
        if (detailUser?.id === user.id && newList?.length) {
          const updated = newList.find((u) => u.id === user.id)
          if (updated) setDetailUser(updated)
        }
      })
      .catch((err: { message?: string; error?: string }) => {
        addNotification('error', err?.message ?? err?.error ?? 'Thao tác khóa/mở khóa thất bại.')
      })
      .finally(() => setLockConfirmLoading(false))
  }

  const openResetConfirm = (user: UserListItem) => setResetConfirmUser(user)
  const closeResetConfirm = () => {
    if (!resetConfirmLoading) setResetConfirmUser(null)
  }

  const handleConfirmResetPassword = () => {
    const user = resetConfirmUser
    if (!user) return
    setResetConfirmLoading(true)
    userApi
      .resetPassword(user.id)
      .then(() => {
        setResetConfirmUser(null)
        addNotification(
          'success',
          'Đã gửi yêu cầu đặt lại mật khẩu. Người dùng sẽ nhận mật khẩu mới qua email.'
        )
      })
      .catch((err: { message?: string; error?: string }) => {
        addNotification('error', err?.message ?? err?.error ?? 'Đặt lại mật khẩu thất bại.')
      })
      .finally(() => setResetConfirmLoading(false))
  }

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
        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={handleSearch} role="search">
            <span className={styles.searchIcon} aria-hidden>
              <FiSearch />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Tìm theo tên đăng nhập, họ tên, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm tài khoản"
            />
            <button type="submit" className={styles.searchBtn}>
              Tìm kiếm
            </button>
          </form>
        </div>

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
                    <ThSort
                      key={field}
                      field={field}
                      label={label}
                      className={TH_CLASS_BY_FIELD[field]}
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  ))}
                  <th className={styles.thAction}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((user, index) => {
                  const stt = (displayPage - 1) * PAGE_SIZE + index + 1
                  const isActive = user.isActived
                  return (
                    <tr key={user.id}>
                      <td className={styles.tdId}>{stt}</td>
                      <td className={styles.tdUsername}>{user.username}</td>
                      <td className={styles.tdFullName} title={user.fullName}>
                        {user.fullName}
                      </td>
                      <td className={styles.tdEmail} title={user.email.email}>
                        <span className={styles.email}>{user.email.email}</span>
                      </td>
                      <td>{user.phoneNumber ?? '—'}</td>
                      <td className={styles.tdStatus}>
                        {isActive ? (
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
                            onClick={() => openResetConfirm(user)}
                            title="Reset mật khẩu"
                            aria-label={`Reset mật khẩu ${user.username}`}
                          >
                            <FiKey aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => openLockConfirm(user)}
                            title={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            aria-label={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {isActive ? <FiLock aria-hidden /> : <FiUnlock aria-hidden />}
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

      {/* Modal: Xác nhận đặt lại mật khẩu */}
      {resetConfirmUser && (
        <div
          className={styles.modalOverlay}
          onClick={closeResetConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 id="reset-confirm-title" className={styles.confirmModalTitle}>
              Xác nhận đặt lại mật khẩu
            </h2>
            <p className={styles.confirmModalMessage}>
              Bạn có chắc muốn đặt lại mật khẩu cho tài khoản <strong>{resetConfirmUser.username}</strong>?
              Người dùng sẽ nhận mật khẩu mới qua email <strong>{resetConfirmUser.email.email}</strong>.
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.confirmBtnCancel}
                onClick={closeResetConfirm}
                disabled={resetConfirmLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.confirmBtnConfirm}
                onClick={handleConfirmResetPassword}
                disabled={resetConfirmLoading}
              >
                {resetConfirmLoading ? 'Đang gửi…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận khóa / mở khóa */}
      {lockConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={closeLockConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lock-confirm-title"
        >
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 id="lock-confirm-title" className={styles.confirmModalTitle}>
              {lockConfirm.action === 'lock' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
            </h2>
            <p className={styles.confirmModalMessage}>
              {lockConfirm.action === 'lock' ? (
                <>
                  Bạn có chắc muốn <strong>khóa</strong> tài khoản <strong>{lockConfirm.user.username}</strong>?
                  Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.
                </>
              ) : (
                <>
                  Bạn có chắc muốn <strong>mở khóa</strong> tài khoản <strong>{lockConfirm.user.username}</strong>?
                  Người dùng có thể đăng nhập lại.
                </>
              )}
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.confirmBtnCancel}
                onClick={closeLockConfirm}
                disabled={lockConfirmLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.confirmBtnConfirm}
                onClick={handleConfirmLockUnlock}
                disabled={lockConfirmLoading}
              >
                {lockConfirmLoading ? 'Đang xử lý…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Chi tiết người dùng */}
      {detailUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setDetailUser(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="user-detail-title" className={styles.modalTitle}>
                Chi tiết người dùng
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
              <div className={styles.detailProfile}>
                <div className={styles.detailAvatar} aria-hidden>
                  {getInitials(detailUser.fullName)}
                </div>
                <div className={styles.detailProfileInfo}>
                  <p className={styles.detailProfileName}>{detailUser.fullName}</p>
                  <p className={styles.detailProfileUsername}>@{detailUser.username}</p>
                  <span
                    className={
                      detailUser.isActived ? styles.detailBadgeActive : styles.detailBadgeInactive
                    }
                  >
                    {detailUser.isActived ? (
                      <><FiCheck aria-hidden /> Hoạt động</>
                    ) : (
                      <><FiLock aria-hidden /> Đã khóa</>
                    )}
                  </span>
                </div>
              </div>

              <section className={styles.detailSection} aria-labelledby="detail-personal">
                <h3 id="detail-personal" className={styles.detailSectionTitle}>
                  <FiUser aria-hidden /> Thông tin cá nhân
                </h3>
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
                    <dt>Giới tính</dt>
                    <dd>{GENDER_LABEL[detailUser.gender] ?? detailUser.gender}</dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Ngày sinh</dt>
                    <dd>{formatDate(detailUser.dateOfBirth)}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.detailSection} aria-labelledby="detail-contact">
                <h3 id="detail-contact" className={styles.detailSectionTitle}>
                  <FiMail aria-hidden /> Liên hệ
                </h3>
                <dl className={styles.detailList}>
                  <div className={styles.detailRow}>
                    <dt>Email</dt>
                    <dd>
                      <span className={styles.detailValue}>{detailUser.email.email}</span>
                      {detailUser.email.isVerify && (
                        <span className={styles.detailVerified} title="Đã xác thực">
                          <FiCheck aria-hidden /> Đã xác thực
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Số điện thoại</dt>
                    <dd>{detailUser.phoneNumber ?? '—'}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.detailSection} aria-labelledby="detail-account">
                <h3 id="detail-account" className={styles.detailSectionTitle}>
                  <FiCalendar aria-hidden /> Tài khoản
                </h3>
                <dl className={styles.detailList}>
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
              </section>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnClose} onClick={() => setDetailUser(null)}>
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

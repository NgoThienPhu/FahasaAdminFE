import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { FiHome, FiUsers, FiPackage, FiShoppingCart, FiLogOut, FiBook, FiTag } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import styles from './DashboardLayout.module.css'

export const PATHS = {
  login: '/login',
  home: '/',
  users: '/users',
  products: '/products',
  categories: '/categories',
  orders: '/orders',
} as const

export type DashboardMenuId =
  | 'home'
  | 'users'
  | 'products'
  | 'categories'
  | 'orders'

export type DashboardNavItem = {
  id: DashboardMenuId
  path: string
  label: string
  end: boolean
}

const DASHBOARD_NAV: readonly DashboardNavItem[] = [
  { id: 'home', path: PATHS.home, label: 'Trang chủ', end: true },
  { id: 'users', path: PATHS.users, label: 'Người dùng', end: false },
  { id: 'products', path: PATHS.products, label: 'Sách', end: false },
  { id: 'categories', path: PATHS.categories, label: 'Danh mục sách', end: false },
  { id: 'orders', path: PATHS.orders, label: 'Đơn hàng', end: false },
] as const

export type ProductDetailAction = 'view' | 'edit'

export function productDetailPath(id: string | number, action: ProductDetailAction = 'view'): string {
  const base = `${PATHS.products}/${id}`
  return `${base}?action=${action}`
}

export function productEditPath(id: string | number): string {
  return productDetailPath(id, 'edit')
}

const NAV_ICONS: Record<DashboardMenuId, IconType> = {
  home: FiHome,
  users: FiUsers,
  products: FiPackage,
  categories: FiTag,
  orders: FiShoppingCart,
}

function DashboardLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const openLogoutModal = () => setShowLogoutModal(true)
  const closeLogoutModal = () => setShowLogoutModal(false)

  const handleConfirmLogout = async () => {
    closeLogoutModal()
    await logout()
    navigate(PATHS.login, { replace: true })
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandInner}>
            <div className={styles.brandIcon}>
              <FiBook aria-hidden />
            </div>
            <div className={styles.brandText}>
              <h1 className={styles.brandTitle}>Fahasa Admin</h1>
              <p className={styles.brandSub}>Quản lý hệ thống</p>
            </div>
          </div>
        </div>
        <nav>
          <p className={styles.navLabel}>Menu</p>
          <ul className={styles.nav}>
            {DASHBOARD_NAV.map(({ id, path, label, end }) => {
              const Icon = NAV_ICONS[id]
              return (
                <li key={id} className={styles.navItem}>
                  <NavLink
                    to={path}
                    end={end}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                  >
                    <Icon className={styles.navIcon} aria-hidden />
                    {label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={openLogoutModal}
          >
            <FiLogOut className={styles.navIcon} aria-hidden />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>

      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={closeLogoutModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <h2 id="logout-modal-title" className={styles.modalTitle}>
              Xác nhận đăng xuất
            </h2>
            <p className={styles.modalMessage}>
              Bạn có chắc muốn đăng xuất?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={closeLogoutModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.modalBtnConfirm}
                onClick={handleConfirmLogout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardLayout

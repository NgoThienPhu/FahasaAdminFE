import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiPackage, FiShoppingCart, FiLogOut, FiBook, FiTag } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import styles from './DashboardLayout.module.css'

const navItems = [
  { to: '/', end: true, icon: FiHome, label: 'Trang chủ' },
  { to: '/users', end: false, icon: FiUsers, label: 'Người dùng' },
  { to: '/products', end: false, icon: FiPackage, label: 'Sách' },
  { to: '/categories', end: false, icon: FiTag, label: 'Danh mục sách' },
  { to: '/orders', end: false, icon: FiShoppingCart, label: 'Đơn hàng' },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const openLogoutModal = () => setShowLogoutModal(true)
  const closeLogoutModal = () => setShowLogoutModal(false)

  const handleConfirmLogout = async () => {
    closeLogoutModal()
    await logout()
    navigate('/login', { replace: true })
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
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <li key={to} className={styles.navItem}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                  }
                >
                  <Icon className={styles.navIcon} aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
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

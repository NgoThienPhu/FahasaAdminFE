import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiPackage, FiShoppingCart, FiLogOut } from 'react-icons/fi'
import styles from './DashboardLayout.module.css'

const navItems = [
  { to: '/', end: true, icon: FiHome, label: 'Trang chủ' },
  { to: '/users', end: false, icon: FiUsers, label: 'Người dùng' },
  { to: '/products', end: false, icon: FiPackage, label: 'Sách' },
  { to: '/orders', end: false, icon: FiShoppingCart, label: 'Đơn hàng' },
]

function DashboardLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // TODO: Gọi API đăng xuất / xóa token nếu cần
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1 className={styles.brandTitle}>Fahasa Admin</h1>
          <p className={styles.brandSub}>Quản lý hệ thống</p>
        </div>
        <nav>
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
            onClick={handleLogout}
          >
            <FiLogOut className={styles.navIcon} aria-hidden />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout

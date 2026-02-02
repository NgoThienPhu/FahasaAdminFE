import { FiHome } from 'react-icons/fi'
import styles from './Dashboard.module.css'

function Dashboard() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <FiHome aria-hidden /> Trang chủ Admin
      </h1>
      <p className={styles.description}>
        Chào mừng bạn đã đăng nhập. Nội dung dashboard sẽ được bổ sung sau.
      </p>
    </div>
  )
}

export default Dashboard

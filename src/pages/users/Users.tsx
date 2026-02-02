import { FiUsers } from 'react-icons/fi'
import styles from './Users.module.css'

function Users() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <FiUsers aria-hidden /> Quản lý Người dùng
      </h1>
      <p className={styles.description}>
        Danh sách và quản lý người dùng. Nội dung sẽ được bổ sung sau.
      </p>
    </div>
  )
}

export default Users

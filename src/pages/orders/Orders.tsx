import { FiShoppingCart } from 'react-icons/fi'
import styles from './Orders.module.css'

function Orders() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <FiShoppingCart aria-hidden /> Quản lý Đơn hàng
      </h1>
      <p className={styles.description}>
        Danh sách và quản lý đơn hàng. Nội dung sẽ được bổ sung sau.
      </p>
    </div>
  )
}

export default Orders

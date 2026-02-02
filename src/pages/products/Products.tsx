import { FiPackage } from 'react-icons/fi'
import styles from './Products.module.css'

function Products() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <FiPackage aria-hidden /> Quản lý Sách
      </h1>
      <p className={styles.description}>
        Danh sách và quản lý sách. Nội dung sẽ được bổ sung sau.
      </p>
    </div>
  )
}

export default Products

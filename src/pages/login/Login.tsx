import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.')
      return
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Gọi API đăng nhập tại đây
      // Ví dụ: const res = await loginApi(formData.username, formData.password)
      // if (res.ok) navigate('/')
      await new Promise((resolve) => setTimeout(resolve, 800))
      navigate('/')
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <FiLogIn className={styles.icon} aria-hidden />
          </div>
          <h1 className={styles.title}>Đăng nhập Admin</h1>
          <p className={styles.subtitle}>Fahasa Admin</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Tên đăng nhập
            </label>
            <div className={styles.inputWrap}>
              <FiUser className={styles.inputIcon} aria-hidden />
              <input
                id="username"
                name="username"
                type="text"
                className={styles.input}
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.inputIcon} aria-hidden />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <HiOutlineEyeOff className={styles.toggleIcon} aria-hidden />
                ) : (
                  <HiOutlineEye className={styles.toggleIcon} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner} aria-hidden />
            ) : (
              <>
                <FiLogIn className={styles.submitIcon} aria-hidden />
                Đăng nhập
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

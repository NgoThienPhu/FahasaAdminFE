import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import authApi from '../../services/apis/authApi'
import type { APIResponseError } from '../../services/apis/config'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addNotification } = useNotification()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      addNotification('error', 'Vui lòng nhập tên đăng nhập.')
      return
    }
    if (!formData.password) {
      addNotification('error', 'Vui lòng nhập mật khẩu.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await authApi.login({
        username: formData.username.trim(),
        password: formData.password,
      })
      localStorage.setItem('accessToken', res.data.accessToken)
      const profileRes = await authApi.getProfile()
      login(profileRes.data)
      navigate('/', { replace: true })
    } catch (err) {
      const apiError = err as APIResponseError
      const msg = apiError?.message || apiError?.error || 'Đăng nhập thất bại. Vui lòng thử lại.'
      addNotification('error', msg)
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

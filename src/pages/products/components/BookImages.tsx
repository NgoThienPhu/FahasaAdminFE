import { useState, useEffect } from 'react'
import { FiImage, FiPlus, FiX, FiCheck, FiTrash2 } from 'react-icons/fi'
import { useNotification } from '../../../contexts/NotificationContext'
import bookImageApi from '../../../services/apis/BookImageApi'
import { API_BE_SERVER_URL } from '../../../services/apis/config'
import type { BookImage } from '../../../services/entities/BookImage'
import styles from './BookImages.module.css'

const SO_ANH_PHU_TOI_DA = 5
const ANH_LOI_SRC =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect fill="%23e2e8f0" width="120" height="120"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3ELỗi%3C/text%3E%3C/svg%3E'

function chuyenThanhUrlDayDu(url: string | undefined): string | undefined {
  if (!url || !url.trim()) return undefined
  if (/^https?:\/\//i.test(url)) return url
  try {
    const origin = new URL(API_BE_SERVER_URL || '', 'http://localhost').origin
    return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`
  } catch {
    return url
  }
}

/** Lấy url từ object API (BookImage có trường url) */
function layUrlTuBookImage(img: unknown): string | undefined {
  if (!img || typeof img !== 'object') return undefined
  const o = img as BookImage
  const url = typeof o.url === 'string' && o.url.trim() ? o.url : undefined
  return url
}

/** Trích danh sách BookImage từ response API (data / data.content / mảng) */
function layDanhSachBookImageTuResponse(res: unknown): BookImage[] {
  const obj = res && typeof res === 'object' ? (res as Record<string, unknown>) : {}
  const data = obj?.data
  if (Array.isArray(data)) return data as BookImage[]
  if (data && typeof data === 'object' && 'content' in data) {
    const content = (data as { content: unknown }).content
    if (Array.isArray(content)) return content as BookImage[]
  }
  if (data && typeof data === 'object' && typeof (data as BookImage).url === 'string')
    return [data as BookImage]
  return []
}

export interface BookImagesProps {
  bookId: string
  bookTitle: string
  isEditing: boolean
  savedExtraImageUrls: string[]
  onPrimaryImageSaved?: (url: string) => void
  onExtraImagesChange: (urls: string[]) => void
  onExtraImagesSaved?: (urls: string[]) => void
}

export function BookImages({
  bookId,
  bookTitle,
  isEditing,
  savedExtraImageUrls,
  onPrimaryImageSaved,
  onExtraImagesChange,
  onExtraImagesSaved,
}: BookImagesProps) {
  const { addNotification } = useNotification()

  const [urlAnhBia, setUrlAnhBia] = useState<string | null>(null)
  const [danhSachAnhPhu, setDanhSachAnhPhu] = useState<string[]>([])
  const [fileAnhBiaMoi, setFileAnhBiaMoi] = useState<File | null>(null)
  const [urlPreviewAnhBia, setUrlPreviewAnhBia] = useState<string | null>(null)
  const [loiHienThiAnhBia, setLoiHienThiAnhBia] = useState(false)
  const [dangTaiAnhBia, setDangTaiAnhBia] = useState(false)
  const [confirmXoaUrl, setConfirmXoaUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!bookId) {
      setUrlAnhBia(null)
      setDanhSachAnhPhu([])
      return
    }
    setUrlAnhBia(null)
    Promise.all([
      bookImageApi.getBookPrimaryImage(bookId),
      bookImageApi.getBookSecondaryImages(bookId),
    ])
      .then(([resBia, resPhu]) => {
        const listBia = layDanhSachBookImageTuResponse(resBia)
        const listPhu = layDanhSachBookImageTuResponse(resPhu)
        const urlBia = chuyenThanhUrlDayDu(layUrlTuBookImage(listBia[0]))
        setUrlAnhBia(urlBia ?? null)
        const urlsPhu = listPhu
          .map((img) => layUrlTuBookImage(img))
          .filter((u): u is string => Boolean(u))
          .map((u) => chuyenThanhUrlDayDu(u))
          .filter((u): u is string => u != null && u !== '')
        setDanhSachAnhPhu(urlsPhu)
      })
      .catch(() => {
        setUrlAnhBia(null)
        setDanhSachAnhPhu([])
      })
  }, [bookId])

  useEffect(() => {
    if (!isEditing) {
      setFileAnhBiaMoi(null)
      setUrlPreviewAnhBia(null)
      if (savedExtraImageUrls.length > 0) {
        setDanhSachAnhPhu(savedExtraImageUrls)
      } else if (bookId) {
        bookImageApi
          .getBookSecondaryImages(bookId)
          .then((resPhu) => {
            const listPhu = layDanhSachBookImageTuResponse(resPhu)
            const urlsPhu = listPhu
              .map((img) => layUrlTuBookImage(img))
              .filter((u): u is string => Boolean(u))
              .map((u) => chuyenThanhUrlDayDu(u))
              .filter((u): u is string => u != null && u !== '')
            setDanhSachAnhPhu(urlsPhu)
          })
          .catch(() => setDanhSachAnhPhu([]))
      } else {
        setDanhSachAnhPhu([])
      }
    }
  }, [isEditing, savedExtraImageUrls, bookId])

  useEffect(() => {
    if (!fileAnhBiaMoi) {
      setUrlPreviewAnhBia(null)
      return
    }
    const url = URL.createObjectURL(fileAnhBiaMoi)
    setUrlPreviewAnhBia(url)
    return () => URL.revokeObjectURL(url)
  }, [fileAnhBiaMoi])

  useEffect(() => {
    onExtraImagesChange(danhSachAnhPhu)
  }, [danhSachAnhPhu, onExtraImagesChange])

  useEffect(() => {
    setLoiHienThiAnhBia(false)
  }, [urlPreviewAnhBia ?? urlAnhBia])

  const urlHienThiBia = urlPreviewAnhBia ?? urlAnhBia ?? null
  const hienThiOTrong = !urlHienThiBia || loiHienThiAnhBia
  const anhPhuCoThayDoi =
    savedExtraImageUrls.length !== danhSachAnhPhu.length ||
    savedExtraImageUrls.some((u, i) => u !== danhSachAnhPhu[i])

  const khiChonAnhBia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      setFileAnhBiaMoi(file)
    } else if (file) {
      addNotification('error', 'Vui lòng chọn file ảnh (JPG, PNG, ...)')
    }
    e.target.value = ''
  }

  const xoaAnhBiaMoi = () => setFileAnhBiaMoi(null)

  const luuAnhBia = () => {
    if (!bookId || !fileAnhBiaMoi) return
    setDangTaiAnhBia(true)
    bookImageApi
      .uploadBookPrimaryImage(bookId, fileAnhBiaMoi)
      .then((res: any) => {
        const url = chuyenThanhUrlDayDu(res?.data?.url)
        if (url) {
          setUrlAnhBia(url)
          onPrimaryImageSaved?.(url)
        }
        setFileAnhBiaMoi(null)
        setUrlPreviewAnhBia(null)
        addNotification('success', 'Đã lưu ảnh bìa.')
      })
      .catch((err: any) => {
        addNotification('error', err?.message ?? err?.error ?? 'Lưu ảnh bìa thất bại.')
      })
      .finally(() => setDangTaiAnhBia(false))
  }

  const luuAnhPhu = () => {
    if (
      savedExtraImageUrls.length === danhSachAnhPhu.length &&
      savedExtraImageUrls.every((u, i) => u === danhSachAnhPhu[i])
    )
      return
    onExtraImagesSaved?.(danhSachAnhPhu)
    addNotification('success', 'Đã lưu ảnh phụ.')
  }

  const themAnhPhu = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const conLai = SO_ANH_PHU_TOI_DA - danhSachAnhPhu.length
    if (conLai <= 0) {
      addNotification('error', `Tối đa ${SO_ANH_PHU_TOI_DA} ảnh phụ. Đã đủ.`)
      e.target.value = ''
      return
    }
    const danhSachFile = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) {
        addNotification('error', `Bỏ qua "${f.name}" – chỉ chấp nhận ảnh.`)
        return false
      }
      return true
    })
    const canThem = danhSachFile.slice(0, conLai)
    if (danhSachFile.length > conLai) {
      addNotification('info', `Chỉ thêm được ${conLai} ảnh. Đã bỏ qua ${danhSachFile.length - conLai} ảnh.`)
    }
    if (canThem.length === 0) {
      e.target.value = ''
      return
    }
    let daDoc = 0
    const tong = canThem.length
    const ketQua: string[] = []
    canThem.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') ketQua.push(reader.result)
        if (++daDoc === tong) {
          setDanhSachAnhPhu((prev) => [...prev, ...ketQua.slice(0, SO_ANH_PHU_TOI_DA - prev.length)])
        }
      }
      reader.onerror = () => {
        if (++daDoc === tong) {
          setDanhSachAnhPhu((prev) => [...prev, ...ketQua.slice(0, SO_ANH_PHU_TOI_DA - prev.length)])
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const xoaAnhPhuTheoIndex = (index: number) => {
    setDanhSachAnhPhu((prev) => prev.filter((_, i) => i !== index))
  }

  const moConfirmXoa = (url: string) => setConfirmXoaUrl(url)
  const dongConfirmXoa = () => setConfirmXoaUrl(null)

  const xacNhanXoaAnhPhu = () => {
    if (!confirmXoaUrl) return
    setDanhSachAnhPhu((prev) => {
      const i = prev.indexOf(confirmXoaUrl)
      if (i === -1) return prev
      return prev.filter((_, idx) => idx !== i)
    })
    setConfirmXoaUrl(null)
  }

  const hienThiAnhLoi = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = ANH_LOI_SRC
  }

  const daDuAnhPhu = danhSachAnhPhu.length >= SO_ANH_PHU_TOI_DA
  const classNutThem = daDuAnhPhu ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}` : styles.extraAddHeader

  /** Ảnh từ API / đã lưu (URL server); ảnh mới chọn từ máy (data URL) nằm ở "chờ upload" */
  const anhPhuDaUpload = danhSachAnhPhu.filter((url) => !url.startsWith('data:'))
  const anhPhuChoUpload = danhSachAnhPhu.filter((url) => url.startsWith('data:'))

  return (
    <>
    <div className={styles.coverCol}>
      <div className={styles.coverCard}>
        {hienThiOTrong ? (
          <div className={styles.coverPlaceholder} aria-hidden>
            <FiImage className={styles.coverPlaceholderIcon} />
          </div>
        ) : (
          <img
            src={urlHienThiBia ?? undefined}
            alt={`Bìa: ${bookTitle}`}
            className={styles.coverImg}
            onError={() => setLoiHienThiAnhBia(true)}
          />
        )}
        {isEditing && (
          <div className={styles.imageActionsOverlay}>
            <label className={styles.uploadLabel}>
              <input
                type="file"
                accept="image/*"
                onChange={khiChonAnhBia}
                className={styles.fileInput}
                aria-label="Chọn ảnh bìa mới"
              />
              <FiImage aria-hidden /> Thêm ảnh
            </label>
            {fileAnhBiaMoi && (
              <button type="button" className={styles.removeImageBtn} onClick={xoaAnhBiaMoi}>
                Xóa ảnh
              </button>
            )}
          </div>
        )}
        {isEditing && fileAnhBiaMoi && (
          <div className={styles.savePrimaryImageOverlay}>
            <button
              type="button"
              className={styles.savePrimaryImageBtn}
              onClick={luuAnhBia}
              disabled={dangTaiAnhBia}
              aria-label="Lưu ảnh bìa"
            >
              {dangTaiAnhBia ? 'Đang lưu…' : <><FiCheck aria-hidden /> Lưu</>}
            </button>
          </div>
        )}
      </div>

      <section className={styles.extraSection} aria-label="Ảnh phụ">
        <div
          className={
            isEditing && anhPhuCoThayDoi
              ? `${styles.extraSectionHeader} ${styles.extraSectionHeaderTwoRows}`
              : styles.extraSectionHeader
          }
        >
          <div className={styles.extraSectionFirstRow}>
            <div className={styles.extraSectionTitleRow}>
              <FiImage className={styles.extraSectionIcon} aria-hidden />
              <h2 className={styles.extraSectionTitle}>Ảnh phụ</h2>
            </div>
            {isEditing && !anhPhuCoThayDoi && (
              <div className={styles.extraSectionActions}>
                <label className={classNutThem}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={themAnhPhu}
                    className={styles.fileInput}
                    aria-label="Thêm ảnh phụ"
                    disabled={daDuAnhPhu}
                  />
                  <FiPlus className={styles.extraAddHeaderIcon} aria-hidden />
                  <span>Thêm ảnh</span>
                </label>
              </div>
            )}
          </div>
          {isEditing && anhPhuCoThayDoi && (
            <div className={styles.extraSectionActionsRow}>
              <div className={styles.extraSectionActions}>
                <label className={classNutThem}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={themAnhPhu}
                    className={styles.fileInput}
                    aria-label="Thêm ảnh phụ"
                    disabled={daDuAnhPhu}
                  />
                  <FiPlus className={styles.extraAddHeaderIcon} aria-hidden />
                  <span>Thêm ảnh</span>
                </label>
                <button type="button" className={styles.extraSectionSave} onClick={luuAnhPhu}>
                  Lưu ảnh phụ
                </button>
              </div>
            </div>
          )}
          {isEditing && (
            <p className={styles.extraSectionHint}>
              {daDuAnhPhu
                ? `Đã đủ ${SO_ANH_PHU_TOI_DA} ảnh phụ.`
                : `Có thể thêm tối đa ${SO_ANH_PHU_TOI_DA - danhSachAnhPhu.length} ảnh nữa (tối đa ${SO_ANH_PHU_TOI_DA} ảnh phụ).`}
            </p>
          )}
        </div>

        {isEditing ? (
          <div className={styles.extraPart}>
            {anhPhuChoUpload.length === 0 && (
              <>
                <h3 className={styles.extraPartTitle}>Danh sách ảnh đã upload</h3>
                {anhPhuDaUpload.length > 0 ? (
                  <div className={styles.extraGrid}>
                    {anhPhuDaUpload.map((url, index) => (
                      <div key={`da-luu-${url}-${index}`} className={`${styles.extraThumbWrap} ${styles.extraThumbWrapHoverRemove}`}>
                        <img src={url} alt={`Ảnh đã lưu ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                        <button
                          type="button"
                          className={styles.extraThumbRemove}
                          onClick={() => moConfirmXoa(url)}
                          aria-label={`Xóa ảnh phụ ${index + 1}`}
                          title="Xóa ảnh"
                        >
                          <FiX aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.extraEmpty}>Chưa có ảnh nào đã upload.</p>
                )}
              </>
            )}
            {anhPhuChoUpload.length > 0 && (
              <>
                <h3 className={styles.extraPartTitle}>Ảnh chờ upload</h3>
                <div className={styles.extraGrid}>
                  {anhPhuChoUpload.map((url, index) => {
                    const indexTrongDanhSach = anhPhuDaUpload.length + index
                    return (
                      <div key={`cho-upload-${indexTrongDanhSach}`} className={styles.extraThumbWrap}>
                        <img src={url} alt={`Ảnh chờ upload ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                        <button
                          type="button"
                          className={styles.extraThumbRemove}
                          onClick={() => xoaAnhPhuTheoIndex(indexTrongDanhSach)}
                          aria-label={`Xóa ảnh chờ upload ${index + 1}`}
                          title="Xóa ảnh"
                        >
                          <FiX aria-hidden />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          danhSachAnhPhu.length > 0 ? (
            <div className={styles.extraGridView}>
              {danhSachAnhPhu.map((url, index) => (
                <div key={`xem-${index}`} className={styles.extraThumbWrapView}>
                  <img src={url} alt={`Ảnh phụ ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.extraEmpty}>
              Chưa có ảnh phụ. Nhấn <strong>Chỉnh sửa</strong> để thêm ảnh.
            </p>
          )
        )}
      </section>
    </div>

    {confirmXoaUrl && (
      <div
        className={styles.confirmOverlay}
        onClick={dongConfirmXoa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-xoa-anh-phu-title"
      >
        <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmModalIcon} aria-hidden>
            <FiTrash2 />
          </div>
          <h2 id="confirm-xoa-anh-phu-title" className={styles.confirmModalTitle}>
            Xóa ảnh phụ?
          </h2>
          <p className={styles.confirmModalMessage}>
            Bạn có chắc muốn xóa ảnh phụ này? Hành động không thể hoàn tác.
          </p>
          <div className={styles.confirmModalActions}>
            <button type="button" className={styles.confirmModalBtnCancel} onClick={dongConfirmXoa}>
              Hủy
            </button>
            <button type="button" className={styles.confirmModalBtnDanger} onClick={xacNhanXoaAnhPhu}>
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { FiImage, FiPlus, FiX, FiCheck, FiTrash2 } from 'react-icons/fi'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
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

/** Một ảnh phụ đã lưu trên server (có id để xóa) */
interface SavedSecondaryImage {
  id: string
  url: string
}

export interface BookImagesProps {
  bookId: string
  bookTitle: string
  isEditing: boolean
  savedExtraImageUrls: string[]
  onPrimaryImageSaved?: (url: string) => void
  onExtraImagesChange: (urls: string[]) => void
  onExtraImagesSaved?: (urls: string[]) => void
  /** Gọi khi bắt đầu/kết thúc upload ảnh phụ để parent có thể disable các nút khác */
  onExtraImagesUploading?: (uploading: boolean) => void
  /** Gọi khi bắt đầu/kết thúc upload ảnh chính (bìa) để parent có thể disable các nút khác */
  onPrimaryImageUploading?: (uploading: boolean) => void
}

export function BookImages({
  bookId,
  bookTitle,
  isEditing,
  savedExtraImageUrls,
  onPrimaryImageSaved,
  onExtraImagesChange,
  onExtraImagesSaved,
  onExtraImagesUploading,
  onPrimaryImageUploading,
}: BookImagesProps) {
  const { addNotification } = useNotification()

  const [urlAnhBia, setUrlAnhBia] = useState<string | null>(null)
  const [savedSecondaryImages, setSavedSecondaryImages] = useState<SavedSecondaryImage[]>([])
  const [pendingSecondaryFiles, setPendingSecondaryFiles] = useState<File[]>([])
  const [fileAnhBiaMoi, setFileAnhBiaMoi] = useState<File | null>(null)
  const [urlPreviewAnhBia, setUrlPreviewAnhBia] = useState<string | null>(null)
  const [loiHienThiAnhBia, setLoiHienThiAnhBia] = useState(false)
  const [dangTaiAnhBia, setDangTaiAnhBia] = useState(false)
  const [dangTaiAnhPhu, setDangTaiAnhPhu] = useState(false)
  const [dangXoaAnhPhu, setDangXoaAnhPhu] = useState(false)
  const [itemXoaAnhPhu, setItemXoaAnhPhu] = useState<SavedSecondaryImage | null>(null)

  /** Preview URLs cho ảnh phụ đang chờ upload */
  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([])
  useEffect(() => {
    if (pendingSecondaryFiles.length === 0) {
      setPendingPreviewUrls([])
      return
    }
    const urls = pendingSecondaryFiles.map((f) => URL.createObjectURL(f))
    setPendingPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingSecondaryFiles])

  useEffect(() => {
    if (!bookId) {
      setUrlAnhBia(null)
      setSavedSecondaryImages([])
      setPendingSecondaryFiles([])
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
        const saved = listPhu
          .map((img) => {
            const url = chuyenThanhUrlDayDu(layUrlTuBookImage(img))
            return url && img.id ? { id: img.id, url } : null
          })
          .filter((x): x is SavedSecondaryImage => x != null)
        setSavedSecondaryImages(saved)
      })
      .catch(() => {
        setUrlAnhBia(null)
        setSavedSecondaryImages([])
      })
  }, [bookId])

  useEffect(() => {
    if (!isEditing) {
      setFileAnhBiaMoi(null)
      setUrlPreviewAnhBia(null)
      setPendingSecondaryFiles([])
      if (bookId) {
        bookImageApi
          .getBookSecondaryImages(bookId)
          .then((resPhu) => {
            const listPhu = layDanhSachBookImageTuResponse(resPhu)
            const saved = listPhu
              .map((img) => {
                const url = chuyenThanhUrlDayDu(layUrlTuBookImage(img))
                return url && img.id ? { id: img.id, url } : null
              })
              .filter((x): x is SavedSecondaryImage => x != null)
            setSavedSecondaryImages(saved)
          })
          .catch(() => setSavedSecondaryImages([]))
      }
    }
  }, [isEditing, bookId])

  useEffect(() => {
    if (!fileAnhBiaMoi) {
      setUrlPreviewAnhBia(null)
      return
    }
    const url = URL.createObjectURL(fileAnhBiaMoi)
    setUrlPreviewAnhBia(url)
    return () => URL.revokeObjectURL(url)
  }, [fileAnhBiaMoi])

  const danhSachAnhPhu = useMemo(
    () => savedSecondaryImages.map((x) => x.url).concat(pendingPreviewUrls),
    [savedSecondaryImages, pendingPreviewUrls]
  )

  useEffect(() => {
    onExtraImagesChange(danhSachAnhPhu)
  }, [danhSachAnhPhu, onExtraImagesChange])

  useEffect(() => {
    onExtraImagesUploading?.(dangTaiAnhPhu)
  }, [dangTaiAnhPhu, onExtraImagesUploading])

  useEffect(() => {
    onPrimaryImageUploading?.(dangTaiAnhBia)
  }, [dangTaiAnhBia, onPrimaryImageUploading])

  /** Đang upload bất kỳ ảnh nào (bìa hoặc phụ) → disable các nút có thể ảnh hưởng */
  const dangUploadHinhAnh = dangTaiAnhBia || dangTaiAnhPhu

  useEffect(() => {
    setLoiHienThiAnhBia(false)
  }, [urlPreviewAnhBia ?? urlAnhBia])

  const urlHienThiBia = urlPreviewAnhBia ?? urlAnhBia ?? null
  const hienThiOTrong = !urlHienThiBia || loiHienThiAnhBia
  const anhPhuCoThayDoi =
    savedExtraImageUrls.length !== danhSachAnhPhu.length ||
    savedExtraImageUrls.some((u, i) => u !== danhSachAnhPhu[i])
  const soAnhPhuHienTai = savedSecondaryImages.length + pendingSecondaryFiles.length

  /** Slides cho lightbox: ảnh bìa (nếu có) + toàn bộ ảnh phụ (đã lưu + chờ upload) */
  const lightboxSlides = useMemo(() => {
    const s: { src: string; alt?: string }[] = []
    if (urlHienThiBia) s.push({ src: urlHienThiBia, alt: `Bìa: ${bookTitle}` })
    danhSachAnhPhu.forEach((url, i) => s.push({ src: url, alt: `Ảnh phụ ${i + 1}` }))
    return s
  }, [urlHienThiBia, danhSachAnhPhu, bookTitle])

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const moLightbox = (index: number) => {
    if (lightboxSlides.length === 0) return
    setLightboxIndex(Math.min(index, lightboxSlides.length - 1))
    setLightboxOpen(true)
  }

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

  const luuAnhPhu = async () => {
    if (
      savedExtraImageUrls.length === danhSachAnhPhu.length &&
      savedExtraImageUrls.every((u, i) => u === danhSachAnhPhu[i])
    )
      return
    if (pendingSecondaryFiles.length > 0 && bookId) {
      setDangTaiAnhPhu(true)
      try {
        const res = await bookImageApi.uploadBookSecondaryImage(bookId, pendingSecondaryFiles)
        const listMoi = layDanhSachBookImageTuResponse(res)
        const savedMoi = listMoi
          .map((img) => {
            const url = chuyenThanhUrlDayDu(layUrlTuBookImage(img))
            return url && img.id ? { id: img.id, url } : null
          })
          .filter((x): x is SavedSecondaryImage => x != null)
        setSavedSecondaryImages((prev) => [...prev, ...savedMoi])
        setPendingSecondaryFiles([])
        const allUrls = [...savedSecondaryImages.map((x) => x.url), ...savedMoi.map((x) => x.url)]
        onExtraImagesSaved?.(allUrls)
        addNotification('success', 'Đã upload ảnh phụ.')
      } catch (err: unknown) {
        const msg = (err as { message?: string; error?: string })?.message ?? (err as { message?: string; error?: string })?.error ?? 'Upload ảnh phụ thất bại.'
        addNotification('error', msg)
      } finally {
        setDangTaiAnhPhu(false)
      }
    } else {
      onExtraImagesSaved?.(danhSachAnhPhu)
      addNotification('success', 'Đã lưu ảnh phụ.')
    }
  }

  const themAnhPhu = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const conLai = SO_ANH_PHU_TOI_DA - soAnhPhuHienTai
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
    setPendingSecondaryFiles((prev) => [...prev, ...canThem].slice(0, SO_ANH_PHU_TOI_DA - savedSecondaryImages.length))
    e.target.value = ''
  }

  const xoaAnhPhuPendingTheoIndex = (index: number) => {
    setPendingSecondaryFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moConfirmXoaAnhPhu = (item: SavedSecondaryImage) => setItemXoaAnhPhu(item)
  const dongConfirmXoa = () => setItemXoaAnhPhu(null)

  const xacNhanXoaAnhPhu = async () => {
    if (!bookId || !itemXoaAnhPhu) return
    setDangXoaAnhPhu(true)
    try {
      await bookImageApi.deleteBookSecondaryImage(bookId, itemXoaAnhPhu.id)
      setSavedSecondaryImages((prev) => prev.filter((x) => x.id !== itemXoaAnhPhu.id))
      onExtraImagesSaved?.(
        savedSecondaryImages.filter((x) => x.id !== itemXoaAnhPhu.id).map((x) => x.url).concat(pendingPreviewUrls)
      )
      addNotification('success', 'Đã xóa ảnh phụ.')
    } catch (err: unknown) {
      const msg = (err as { message?: string; error?: string })?.message ?? (err as { message?: string; error?: string })?.error ?? 'Xóa ảnh phụ thất bại.'
      addNotification('error', msg)
    } finally {
      setDangXoaAnhPhu(false)
      setItemXoaAnhPhu(null)
    }
  }

  const hienThiAnhLoi = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = ANH_LOI_SRC
  }

  const daDuAnhPhu = soAnhPhuHienTai >= SO_ANH_PHU_TOI_DA
  const classNutThem = daDuAnhPhu ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}` : styles.extraAddHeader

  return (
    <>
    <div className={styles.coverCol}>
      <div className={styles.coverCard}>
        {hienThiOTrong ? (
          <div className={styles.coverPlaceholder} aria-hidden>
            <FiImage className={styles.coverPlaceholderIcon} />
          </div>
        ) : (
          <div
            className={styles.coverImgWrap}
            role="button"
            tabIndex={0}
            onClick={() => moLightbox(0)}
            onKeyDown={(e) => e.key === 'Enter' && moLightbox(0)}
            aria-label="Xem ảnh bìa phóng to"
          >
            <img
              src={urlHienThiBia ?? undefined}
              alt={`Bìa: ${bookTitle}`}
              className={styles.coverImg}
              onError={() => setLoiHienThiAnhBia(true)}
            />
          </div>
        )}
        {isEditing && (
          <div className={styles.imageActionsOverlay}>
            <label className={dangUploadHinhAnh ? `${styles.uploadLabel} ${styles.uploadLabelDisabled}` : styles.uploadLabel}>
              <input
                type="file"
                accept="image/*"
                onChange={khiChonAnhBia}
                className={styles.fileInput}
                aria-label="Chọn ảnh bìa mới"
                disabled={dangUploadHinhAnh}
              />
              <FiImage aria-hidden /> Thêm ảnh
            </label>
            {fileAnhBiaMoi && (
              <button type="button" className={styles.removeImageBtn} onClick={xoaAnhBiaMoi} disabled={dangUploadHinhAnh}>
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
              disabled={dangUploadHinhAnh}
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
            {isEditing && (
              <span className={styles.extraSectionCount}>{soAnhPhuHienTai} / {SO_ANH_PHU_TOI_DA} Ảnh</span>
            )}
            {isEditing && !anhPhuCoThayDoi && (
              <div className={styles.extraSectionActions}>
                <label className={daDuAnhPhu || dangUploadHinhAnh ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}` : styles.extraAddHeader}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={themAnhPhu}
                    className={styles.fileInput}
                    aria-label="Thêm ảnh phụ"
                    disabled={daDuAnhPhu || dangUploadHinhAnh}
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
                  <label className={daDuAnhPhu || dangUploadHinhAnh ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}` : classNutThem}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={themAnhPhu}
                      className={styles.fileInput}
                      aria-label="Thêm ảnh phụ"
                      disabled={daDuAnhPhu || dangUploadHinhAnh}
                    />
                    <FiPlus className={styles.extraAddHeaderIcon} aria-hidden />
                    <span>Thêm ảnh</span>
                  </label>
                  <button
                    type="button"
                    className={styles.extraSectionSave}
                    onClick={luuAnhPhu}
                    disabled={dangUploadHinhAnh || pendingSecondaryFiles.length === 0}
                  >
                    {dangTaiAnhPhu ? 'Đang lưu…' : 'Lưu ảnh phụ'}
                  </button>
                </div>
              </div>
            )}
        </div>

        {isEditing ? (
          <div className={styles.extraPart}>
            {pendingPreviewUrls.length === 0 && (
              <>
                <h3 className={styles.extraPartTitle}>Danh sách ảnh đã upload</h3>
                {savedSecondaryImages.length > 0 ? (
                  <div className={styles.extraGrid}>
                    {savedSecondaryImages.map((item, index) => {
                      const slideIndex = (urlHienThiBia ? 1 : 0) + index
                      return (
                      <div key={`da-luu-${item.id}`} className={`${styles.extraThumbWrap} ${styles.extraThumbWrapHoverRemove}`}>
                        <div className={styles.extraThumbImgWrap} onClick={() => moLightbox(slideIndex)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && moLightbox(slideIndex)} aria-label={`Xem ảnh ${index + 1}`}>
                          <img src={item.url} alt={`Ảnh đã lưu ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                        </div>
                        <button
                          type="button"
                          className={styles.extraThumbRemove}
                          onClick={() => moConfirmXoaAnhPhu(item)}
                          disabled={dangXoaAnhPhu || dangUploadHinhAnh}
                          aria-label={`Xóa ảnh phụ ${index + 1}`}
                          title="Xóa ảnh"
                        >
                          <FiX aria-hidden />
                        </button>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <p className={styles.extraEmpty}>Chưa có ảnh nào đã upload.</p>
                )}
              </>
            )}
            {pendingPreviewUrls.length > 0 && (
              <>
                <h3 className={styles.extraPartTitle}>Ảnh chờ upload</h3>
                <div className={styles.extraGrid}>
                  {pendingPreviewUrls.map((url, index) => {
                    const slideIndex = (urlHienThiBia ? 1 : 0) + savedSecondaryImages.length + index
                    return (
                    <div key={`cho-upload-${index}`} className={styles.extraThumbWrap}>
                      <div className={styles.extraThumbImgWrap} onClick={() => moLightbox(slideIndex)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && moLightbox(slideIndex)} aria-label={`Xem ảnh chờ upload ${index + 1}`}>
                        <img src={url} alt={`Ảnh chờ upload ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                      </div>
                      <button
                        type="button"
                        className={styles.extraThumbRemove}
                        onClick={() => xoaAnhPhuPendingTheoIndex(index)}
                        disabled={dangUploadHinhAnh}
                        aria-label={`Xóa ảnh chờ upload ${index + 1}`}
                        title="Xóa ảnh"
                      >
                        <FiX aria-hidden />
                      </button>
                    </div>
                  );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          danhSachAnhPhu.length > 0 ? (
            <div className={styles.extraGridView}>
              {danhSachAnhPhu.map((url, index) => {
                const slideIndex = (urlHienThiBia ? 1 : 0) + index
                return (
                <div key={`xem-${index}`} className={styles.extraThumbWrapView} onClick={() => moLightbox(slideIndex)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && moLightbox(slideIndex)} aria-label={`Xem ảnh phụ ${index + 1}`}>
                  <img src={url} alt={`Ảnh phụ ${index + 1}`} className={styles.extraThumbImg} onError={hienThiAnhLoi} />
                </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.extraEmpty}>
              Chưa có ảnh phụ. Nhấn <strong>Chỉnh sửa</strong> để thêm ảnh.
            </p>
          )
        )}
      </section>
    </div>

    {lightboxSlides.length > 0 && (
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    )}

    {itemXoaAnhPhu && (
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
            <button type="button" className={styles.confirmModalBtnCancel} onClick={dongConfirmXoa} disabled={dangXoaAnhPhu}>
              Hủy
            </button>
            <button type="button" className={styles.confirmModalBtnDanger} onClick={xacNhanXoaAnhPhu} disabled={dangXoaAnhPhu}>
              {dangXoaAnhPhu ? 'Đang xóa…' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

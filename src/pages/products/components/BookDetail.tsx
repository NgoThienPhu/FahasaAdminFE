import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FiEdit2,
  FiEye,
  FiUser,
  FiHash,
  FiTag,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiArrowLeft,
} from 'react-icons/fi'
import { useNotification } from '../../../contexts/NotificationContext'
import type { Book as EntityBook } from '../../../services/entities/Book'
import type { Category } from '../../../services/entities/Category'
import bookApi from '../../../services/apis/BookApi'
import categoryApi from '../../../services/apis/CategoryApi'
import { BookEditForm, type BookEditFormBook } from './BookEditForm'
import { BookImages } from './BookImages'
import Loading from '../../../components/Loading/Loading'
import styles from './BookDetail.module.css'

const VE_TRANG_SACH = '/products'

interface Book extends EntityBook {
  coverImageUrl?: string
  extraImageUrls?: string[]
  categoryName?: string
}

type PageMode = 'view' | 'edit'
type BookLoadState = 'loading' | 'ready' | 'error'

const DEFAULT_ACTION: PageMode = 'view'
const HTML_LIKE = /<[a-z/]/

function layGia(book: Book | null | undefined): number | null {
  return book?.price?.price ?? null
}

function dinhDangTien(so: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(so)
}

function dinhDangNgay(chuoiNgay: string | null | undefined): string {
  if (!chuoiNgay) return '—'
  return new Date(chuoiNgay).toLocaleDateString('vi-VN')
}

function layTenDanhMuc(book: Book): string {
  return book.category?.name ?? '—'
}

function layThongBaoLoi(loi: unknown, macDinh: string): string {
  if (loi && typeof loi === 'object' && 'message' in loi) return String((loi as { message: string }).message)
  if (loi && typeof loi === 'object' && 'error' in loi) return String((loi as { error: string }).error)
  return macDinh
}

function tachSachTuResponse(res: Book | { data?: Book }): Book | null {
  const data = (res as { data?: Book }).data ?? (res as Book)
  return data && typeof data === 'object' ? data : null
}

function KhungTrang({
  nutLuiAria,
  nutLuiChu,
  children,
}: {
  nutLuiAria: string
  nutLuiChu: string
  children: ReactNode
}) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to={VE_TRANG_SACH} className={styles.backBtn} aria-label={nutLuiAria}>
          <FiArrowLeft aria-hidden /> {nutLuiChu}
        </Link>
      </div>
      {children}
    </div>
  )
}

export default function BookDetail() {
  const { id: bookId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification } = useNotification()

  const mode: PageMode = useMemo(
    () => (searchParams.get('action') === 'edit' ? 'edit' : DEFAULT_ACTION),
    [searchParams]
  )

  const [book, setBook] = useState<Book | undefined>(undefined)
  const [bookLoadState, setBookLoadState] = useState<BookLoadState>('loading')
  const [danhMucSach, setDanhMucSach] = useState<Category[]>([])
  const [dangUploadAnhPhu, setDangUploadAnhPhu] = useState(false)
  const [dangUploadAnhBia, setDangUploadAnhBia] = useState(false)
  const [danhSachAnhPhuHienTai, setDanhSachAnhPhuHienTai] = useState<string[]>([])

  useEffect(() => {
    if (!bookId) return

    let cancelled = false
    setBookLoadState('loading')

    bookApi
      .findBookById(bookId)
      .then((res: Book | { data: Book }) => {
        if (cancelled) return
        const data = tachSachTuResponse(res)
        if (data) {
          setBook(data)
          setBookLoadState('ready')
        } else {
          setBook(undefined)
          setBookLoadState('error')
        }
      })
      .catch((err) => {
        if (cancelled) return
        addNotification('error', layThongBaoLoi(err, `Không tìm thấy sách "${bookId}".`))
        setBook(undefined)
        setBookLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [bookId, addNotification])

  useEffect(() => {
    categoryApi
      .getCategories({ page: 0, pageSize: 1000, orderBy: 'ASC', sortBy: 'name' })
      .then((res: { data?: Category[] }) => {
        const list = res.data ?? []
        setDanhMucSach(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        addNotification('error', layThongBaoLoi(err, 'Không thể tải danh mục sách.'))
        setDanhMucSach([])
      })
  }, [addNotification])

  const anhPhuDaLuu = useMemo(() => book?.extraImageUrls ?? [], [book?.extraImageUrls])

  const anhPhuCoThayDoiChuaLuu = useMemo(
    () =>
      anhPhuDaLuu.length !== danhSachAnhPhuHienTai.length ||
      anhPhuDaLuu.some((url, i) => url !== danhSachAnhPhuHienTai[i]),
    [anhPhuDaLuu, danhSachAnhPhuHienTai]
  )

  const chuyenAction = useCallback(
    (id: string, action: PageMode) => {
      if (String(id) !== String(bookId)) {
        navigate({ pathname: `${VE_TRANG_SACH}/${id}`, search: `?action=${action}` }, { replace: true })
      } else {
        setSearchParams({ action }, { replace: true })
      }
    },
    [bookId, navigate, setSearchParams]
  )

  const veTrangXem = useCallback((id: string) => chuyenAction(id, DEFAULT_ACTION), [chuyenAction])
  const veTrangSua = useCallback((id: string) => chuyenAction(id, 'edit'), [chuyenAction])

  const khiDaCapNhatSach = useCallback(
    (sachDaCapNhat: BookEditFormBook) => {
      setBook(sachDaCapNhat as Book)
      veTrangXem(String(sachDaCapNhat.id))
    },
    [veTrangXem]
  )

  const huyChinhSua = useCallback(() => {
    if (bookId) veTrangXem(bookId)
  }, [bookId, veTrangXem])

  const khiDaLuuAnhBia = useCallback((urlAnhBia: string) => {
    setBook((b) => (b ? { ...b, coverImageUrl: urlAnhBia } : b))
  }, [])

  const khiDaLuuAnhPhu = useCallback((danhSachUrl: string[]) => {
    setBook((b) => (b ? { ...b, extraImageUrls: danhSachUrl } : b))
  }, [])

  if (!bookId) {
    return (
      <KhungTrang nutLuiAria="Quay lại trang quản lý sách" nutLuiChu="Quay lại trang quản lý sách">
        <p className={styles.error}>Thiếu mã sách.</p>
      </KhungTrang>
    )
  }

  if (bookLoadState === 'loading') {
    return (
      <KhungTrang nutLuiAria="Quản lý sách" nutLuiChu="Quản lý sách">
        <div className={styles.card}>
          <div className={styles.bookPageLoadingWrap} role="status" aria-live="polite">
            <Loading notify="Đang tải sách…" />
          </div>
        </div>
      </KhungTrang>
    )
  }

  if (bookLoadState === 'error' || !book) {
    return (
      <KhungTrang nutLuiAria="Quay lại trang quản lý sách" nutLuiChu="Quay lại trang quản lý sách">
        <p className={styles.error}>Không tìm thấy sách với mã "{bookId}".</p>
      </KhungTrang>
    )
  }

  const gia = layGia(book)
  const dangSua = mode === 'edit'

  const imageEditHandlers = dangSua
    ? {
        onPrimaryImageSaved: khiDaLuuAnhBia,
        onExtraImagesSaved: khiDaLuuAnhPhu,
        onExtraImagesUploading: setDangUploadAnhPhu,
        onPrimaryImageUploading: setDangUploadAnhBia,
      }
    : {}

  return (
    <KhungTrang nutLuiAria="Quản lý sách" nutLuiChu="Quản lý sách">
      <div className={styles.card}>
        <div className={styles.hero}>
          <BookImages
            bookId={book.id}
            bookTitle={book.title ?? ''}
            isEditing={dangSua}
            savedExtraImageUrls={anhPhuDaLuu}
            onExtraImagesChange={dangSua ? setDanhSachAnhPhuHienTai : () => {}}
            {...imageEditHandlers}
          />

          <div className={styles.detailCol}>
            <div className={styles.detailColOverlay}>
              {dangSua ? (
                <button
                  type="button"
                  className={styles.editBtnOverlay}
                  title="Xem chi tiết (chỉ đọc)"
                  aria-label="Xem chi tiết sách"
                  onClick={() => veTrangXem(bookId)}
                >
                  <FiEye aria-hidden /> Xem
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.editBtnOverlay}
                  title="Chỉnh sửa sách"
                  aria-label="Chỉnh sửa sách"
                  onClick={() => veTrangSua(bookId)}
                >
                  <FiEdit2 aria-hidden /> Sửa
                </button>
              )}
            </div>

            {dangSua ? (
              <div className={styles.detailFormOverlayWrap}>
                <BookEditForm
                  book={book}
                  categories={danhMucSach}
                  isExtraDirty={anhPhuCoThayDoiChuaLuu}
                  disableActions={dangUploadAnhPhu || dangUploadAnhBia}
                  onCancel={huyChinhSua}
                  onSuccess={khiDaCapNhatSach}
                />
              </div>
            ) : (
              <div className={`${styles.detailViewWrap} ${styles.detailViewWithOverlay}`}>
                <div className={styles.detailView}>
                  <header className={styles.detailHead}>
                    <h1 className={styles.bookTitle}>{book.title}</h1>
                    <p className={styles.bookAuthor}>
                      <FiUser className={styles.metaIcon} aria-hidden />
                      {book.author}
                    </p>
                    {gia != null && (
                      <div className={styles.priceBadge}>
                        <FiDollarSign aria-hidden />
                        {dinhDangTien(gia)}
                      </div>
                    )}
                  </header>

                  <section className={styles.detailInfoCard} aria-label="Thông tin xuất bản">
                    <div className={styles.detailMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                          <FiTag aria-hidden /> Thể loại
                        </span>
                        <span className={styles.metaValue}>{layTenDanhMuc(book)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                          <FiHash aria-hidden /> ISBN
                        </span>
                        <span className={styles.metaValue}>{book.isbn}</span>
                      </div>
                      {book.publisher && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <FiFileText aria-hidden /> Nhà cung cấp
                          </span>
                          <span className={styles.metaValue}>{book.publisher}</span>
                        </div>
                      )}
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                          <FiCalendar aria-hidden /> Ngày phát hành
                        </span>
                        <span className={styles.metaValue}>{dinhDangNgay(book.publishDate)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                          <FiCalendar aria-hidden /> Ngày tạo
                        </span>
                        <span className={styles.metaValue}>{dinhDangNgay(book.createdAt)}</span>
                      </div>
                    </div>
                  </section>

                  {book.summary != null && book.summary.trim() !== '' && (
                    <section className={styles.detailSummaryCard} aria-label="Tóm tắt">
                      <h2 className={styles.detailDescriptionTitle}>Tóm tắt</h2>
                      <div className={styles.detailSummaryBody}>{book.summary.trim()}</div>
                    </section>
                  )}

                  <section className={styles.detailDescriptionCard} aria-label="Mô tả">
                    <h2 className={styles.detailDescriptionTitle}>Mô tả</h2>
                    <div className={styles.detailDescriptionBody}>
                      {book.description?.trim() ? (
                        HTML_LIKE.test(book.description) ? (
                          <div
                            className={styles.descriptionHtml}
                            dangerouslySetInnerHTML={{ __html: book.description }}
                          />
                        ) : (
                          book.description
                        )
                      ) : (
                        <p className={styles.detailDescriptionEmpty}>Chưa có mô tả.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </KhungTrang>
  )
}

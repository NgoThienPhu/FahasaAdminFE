import { useState, useEffect, useMemo } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  FiEdit2,
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
import bookApi from '../../../services/apis/bookApi'
import categoryApi from '../../../services/apis/CategoryApi'
import { BookEditForm } from './BookEditForm'
import { BookImages } from './BookImages'
import styles from './BookDetail.module.css'

interface Book extends EntityBook {
  coverImageUrl?: string
  extraImageUrls?: string[]
  categoryName?: string
}

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

export default function BookDetail() {
  const { id: bookId } = useParams()
  const location = useLocation()
  const { addNotification } = useNotification()

  const [book, setBook] = useState<Book | undefined>(() => (location.state as any)?.book)
  const [dangChinhSua, setDangChinhSua] = useState(false)
  const [danhSachAnhPhuHienTai, setDanhSachAnhPhuHienTai] = useState<string[]>([])
  const [danhMucSach, setDanhMucSach] = useState<Category[]>([])

  useEffect(() => {
    if (!bookId) return

    bookApi
      .findBookById(bookId)
      .then((res: Book | { data: Book }) => {
        const data = (res as { data?: Book }).data ?? (res as Book)
        if (data && typeof data === 'object') setBook(data)
      })
      .catch((err) => {
        addNotification('error', layThongBaoLoi(err, `Không tìm thấy sách "${bookId}".`))
        setBook(undefined)
      })
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

  const batDauChinhSua = () => setDangChinhSua(true)
  const huyChinhSua = () => setDangChinhSua(false)

  const khiDaCapNhatSach = (sachDaCapNhat: any) => {
    setBook(sachDaCapNhat)
    setDangChinhSua(false)
  }

  const khiDaLuuAnhBia = (urlAnhBia: string) => {
    if (book) setBook({ ...book, coverImageUrl: urlAnhBia })
  }

  const khiDaLuuAnhPhu = (danhSachUrl: string[]) => {
    if (book) setBook({ ...book, extraImageUrls: danhSachUrl })
  }

  const anhPhuDaLuu = useMemo(() => book?.extraImageUrls ?? [], [book?.extraImageUrls])
  const anhPhuCoThayDoiChuaLuu =
    anhPhuDaLuu.length !== danhSachAnhPhuHienTai.length ||
    anhPhuDaLuu.some((url, i) => url !== danhSachAnhPhuHienTai[i])

  if (!bookId) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link to="/products" className={styles.backBtn} aria-label="Quay lại trang quản lý sách">
            <FiArrowLeft aria-hidden /> Quay lại trang quản lý sách
          </Link>
        </div>
        <p className={styles.error}>Thiếu mã sách.</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Link to="/products" className={styles.backBtn} aria-label="Quay lại trang quản lý sách">
            <FiArrowLeft aria-hidden /> Quay lại trang quản lý sách
          </Link>
        </div>
        <p className={styles.error}>Không tìm thấy sách với mã "{bookId}".</p>
      </div>
    )
  }

  const gia = layGia(book)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/products" className={styles.backBtn} aria-label="Quản lý sách">
          <FiArrowLeft aria-hidden /> Quản lý sách
        </Link>
      </div>
      <div className={styles.card}>
        <div className={styles.hero}>
          <BookImages
            bookId={book.id}
            bookTitle={book.title ?? ''}
            isEditing={dangChinhSua}
            savedExtraImageUrls={anhPhuDaLuu}
            onPrimaryImageSaved={khiDaLuuAnhBia}
            onExtraImagesChange={setDanhSachAnhPhuHienTai}
            onExtraImagesSaved={khiDaLuuAnhPhu}
          />

          <div className={styles.detailCol}>
            {!dangChinhSua ? (
              <>
                <div className={styles.detailViewWrap}>
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

                    <section className={styles.detailInfoCard} aria-label="Thông tin sách">
                      <div className={styles.detailMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}><FiTag aria-hidden /> Thể loại</span>
                          <span className={styles.metaValue}>{layTenDanhMuc(book)}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}><FiHash aria-hidden /> ISBN</span>
                          <span className={styles.metaValue}>{book.isbn}</span>
                        </div>
                        {book.publisher && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}><FiFileText aria-hidden /> Nhà cung cấp</span>
                            <span className={styles.metaValue}>{book.publisher}</span>
                          </div>
                        )}
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}><FiCalendar aria-hidden /> Ngày phát hành</span>
                          <span className={styles.metaValue}>{dinhDangNgay(book.publishDate)}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}><FiCalendar aria-hidden /> Ngày tạo</span>
                          <span className={styles.metaValue}>{dinhDangNgay(book.createdAt)}</span>
                        </div>
                      </div>
                    </section>

                    <section className={styles.detailDescriptionCard} aria-label="Mô tả">
                      <h2 className={styles.detailDescriptionTitle}>Mô tả</h2>
                      <div className={styles.detailDescriptionBody}>
                        {book.description?.trim() ? (
                          /<[a-z\/]/.test(book.description) ? (
                            <div className={styles.descriptionHtml} dangerouslySetInnerHTML={{ __html: book.description }} />
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
                <div className={styles.detailViewFooter}>
                  <button type="button" className={styles.editBtnFooter} onClick={batDauChinhSua} aria-label="Chỉnh sửa sách">
                    <FiEdit2 aria-hidden /> Chỉnh sửa
                  </button>
                </div>
              </>
            ) : (
              <BookEditForm
                book={book}
                categories={danhMucSach}
                isExtraDirty={anhPhuCoThayDoiChuaLuu}
                onCancel={huyChinhSua}
                onSuccess={khiDaCapNhatSach}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

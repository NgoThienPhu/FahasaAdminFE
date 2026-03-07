import { useState, useEffect } from 'react'
import {
  FiX,
  FiUser,
  FiHash,
  FiTag,
  FiCalendar,
  FiBook,
  FiPackage,
  FiFileText,
} from 'react-icons/fi'
import { useNotification } from '../../../contexts/NotificationContext'
import type { Category } from '../../../services/entities/Category'
import bookApi from '../../../services/apis/bookApi'
import { TipTapEditor } from '../../../components/TipTapEditor'
import styles from './BookEditForm.module.css'

export type EditFormData = {
  title: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
}

export interface BookEditFormBook {
  id: string
  title?: string
  description?: string
  author?: string
  publisher?: string
  isbn?: string
  publishDate?: string
  createdAt?: string
  category?: { name?: string }
  categoryName?: string
  coverImageUrl?: string
  extraImageUrls?: string[]
}

interface Props {
  book: BookEditFormBook
  categories: Category[]
  isExtraDirty: boolean
  onCancel: () => void
  onSuccess: (updatedBook: BookEditFormBook) => void
}

function validate(form: EditFormData): Record<string, string> {
  const err: Record<string, string> = {}
  if (!form.title?.trim()) err.title = 'Tiêu đề sách không được để trống'
  if (!form.description?.trim()) err.description = 'Mô tả sách không được để trống'
  if (!form.author?.trim()) err.author = 'Tên tác giả không được để trống'
  if (!form.publisher?.trim()) err.publisher = 'Tên nhà cung cấp không được để trống'
  if (!form.isbn?.trim()) err.isbn = 'ISBN không được để trống'
  if (!form.categoryId?.trim()) err.categoryId = 'Loại sản phẩm không được để trống'
  if (!form.publishDate?.trim()) {
    err.publishDate = 'Ngày phát hành không được để trống'
  } else {
    const d = new Date(form.publishDate)
    if (d > new Date()) err.publishDate = 'Ngày phát hành phải trong quá khứ hoặc hôm nay'
  }
  return err
}

export function BookEditForm({ book, categories, isExtraDirty, onCancel, onSuccess }: Props) {
  const { addNotification } = useNotification()

  const [form, setForm] = useState<EditFormData>({
    title: '',
    description: '',
    author: '',
    publisher: '',
    isbn: '',
    categoryId: '',
    publishDate: '',
  })
  const [loi, setLoi] = useState<Record<string, string>>({})
  const [dangGui, setDangGui] = useState(false)

  useEffect(() => {
    if (!book) return
    const tenDanhMuc = book.category?.name ?? ''
    const idDanhMuc = categories.find((c) => c.name === tenDanhMuc)?.id ?? ''
    const ngay = book.publishDate ? book.publishDate.slice(0, 10) : ''
    setForm({
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      publisher: book.publisher ?? '',
      isbn: book.isbn ?? '',
      categoryId: idDanhMuc,
      publishDate: ngay,
    })
  }, [book, categories])

  const idDanhMucGoc = categories.find((c) => c.name === book.category?.name)?.id ?? ''
  const ngayGoc = book.publishDate ? book.publishDate.slice(0, 10) : ''
  const formCoThayDoi =
    form.title !== (book.title ?? '').trim() ||
    (form.description ?? '').trim() !== (book.description ?? '').trim() ||
    form.author !== (book.author ?? '').trim() ||
    form.publisher !== (book.publisher ?? '').trim() ||
    form.isbn !== (book.isbn ?? '').trim() ||
    form.categoryId !== idDanhMucGoc ||
    form.publishDate !== ngayGoc
  const choPhepLuu = formCoThayDoi || isExtraDirty

  const capNhatTruong = (ten: keyof EditFormData, giaTri: string) => {
    setForm((f) => ({ ...f, [ten]: giaTri }))
  }

  const xuLyLuu = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate(form)
    setLoi(err)
    if (Object.keys(err).length > 0) return
    if (!book?.id) return

    setDangGui(true)
    bookApi
      .updateBook(book.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        isbn: form.isbn.trim(),
        categoryId: form.categoryId,
        publishDate: form.publishDate,
      })
      .then((res: import('../../../services/entities/Book').Book | { data: import('../../../services/entities/Book').Book }) => {
        const data = (res as { data?: import('../../../services/entities/Book').Book }).data ?? (res as import('../../../services/entities/Book').Book)
        if (!data || typeof data !== 'object') return
        const sachMoi = {
          ...data,
          coverImageUrl: book.coverImageUrl,
          extraImageUrls: book.extraImageUrls,
        }
        onSuccess(sachMoi)
        addNotification('success', `Đã cập nhật "${sachMoi.title}".`)
      })
      .catch((err: any) => {
        const msg = err?.message ?? err?.error ?? 'Cập nhật thất bại.'
        addNotification('error', msg)
      })
      .finally(() => setDangGui(false))
  }

  return (
    <form onSubmit={xuLyLuu} className={styles.editForm}>
      <div className={styles.editFormBody}>
        <section className={`${styles.formSection} ${styles.formSectionBasic}`}>
          <h3 className={styles.formSectionTitleBasic}>
            <FiBook className={styles.formSectionTitleIcon} aria-hidden />
            Thông tin cơ bản
          </h3>
          <div className={styles.formSectionBasicRow}>
            <div className={styles.formField}>
              <label htmlFor="edit-title" className={styles.formLabel}>
                Tiêu đề sách <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                className={styles.formInput}
                value={form.title}
                onChange={(e) => capNhatTruong('title', e.target.value)}
                placeholder="Nhập tiêu đề sách"
                disabled={dangGui}
              />
              {loi.title && <span className={styles.formError}>{loi.title}</span>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="edit-author" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiUser className={styles.formLabelIcon} aria-hidden />
                Tác giả <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-author"
                type="text"
                className={styles.formInput}
                value={form.author}
                onChange={(e) => capNhatTruong('author', e.target.value)}
                placeholder="Tên tác giả"
                disabled={dangGui}
              />
              {loi.author && <span className={styles.formError}>{loi.author}</span>}
            </div>
          </div>
        </section>

        <section className={`${styles.formSection} ${styles.formSectionPublish}`}>
          <h3 className={styles.formSectionTitleCard}>
            <FiPackage className={styles.formSectionTitleIcon} aria-hidden />
            Thông tin xuất bản
          </h3>
          <div className={styles.formSectionPublishGrid}>
            <div className={styles.formField}>
              <label htmlFor="edit-publisher" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiFileText className={styles.formLabelIcon} aria-hidden />
                Nhà cung cấp <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-publisher"
                type="text"
                className={styles.formInput}
                value={form.publisher}
                onChange={(e) => capNhatTruong('publisher', e.target.value)}
                placeholder="Tên nhà xuất bản / cung cấp"
                disabled={dangGui}
              />
              {loi.publisher && <span className={styles.formError}>{loi.publisher}</span>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="edit-isbn" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiHash className={styles.formLabelIcon} aria-hidden />
                ISBN <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-isbn"
                type="text"
                className={styles.formInput}
                value={form.isbn}
                onChange={(e) => capNhatTruong('isbn', e.target.value)}
                placeholder="978-604-1-00001-1"
                disabled={dangGui}
              />
              {loi.isbn && <span className={styles.formError}>{loi.isbn}</span>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="edit-categoryId" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiTag className={styles.formLabelIcon} aria-hidden />
                Danh mục <span className={styles.required}>*</span>
              </label>
              <select
                id="edit-categoryId"
                className={styles.formSelect}
                value={form.categoryId}
                onChange={(e) => capNhatTruong('categoryId', e.target.value)}
                disabled={dangGui}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {loi.categoryId && <span className={styles.formError}>{loi.categoryId}</span>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="edit-publishDate" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiCalendar className={styles.formLabelIcon} aria-hidden />
                Ngày phát hành <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-publishDate"
                type="date"
                className={styles.formInput}
                value={form.publishDate}
                onChange={(e) => capNhatTruong('publishDate', e.target.value)}
                disabled={dangGui}
              />
              {loi.publishDate && <span className={styles.formError}>{loi.publishDate}</span>}
            </div>
          </div>
        </section>

        <section className={`${styles.formSection} ${styles.formSectionDescription}`}>
          <h3 className={styles.formSectionTitleCard}>
            <FiFileText className={styles.formSectionTitleIcon} aria-hidden />
            Mô tả sách <span className={styles.required}>*</span>
          </h3>
          <div className={`${styles.formField} ${styles.descriptionEditorWrap}`}>
            <TipTapEditor
              id="edit-description"
              value={form.description}
              onChange={(html) => capNhatTruong('description', html)}
              placeholder="Mô tả ngắn (in đậm, in nghiêng, danh sách, link...)"
              disabled={dangGui}
            />
            {loi.description && <span className={styles.formError}>{loi.description}</span>}
          </div>
        </section>
      </div>

      <div className={styles.editFormFooter}>
        <button type="button" className={styles.formBtnCancel} onClick={onCancel} disabled={dangGui}>
          <FiX aria-hidden /> Hủy
        </button>
        <button type="submit" className={styles.formBtnSubmit} disabled={dangGui || !choPhepLuu}>
          {dangGui ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}

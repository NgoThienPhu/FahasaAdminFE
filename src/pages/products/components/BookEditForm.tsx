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
import type { Book } from '../../../services/entities/Book'
import bookApi from '../../../services/apis/BookApi'
import type { APISuccessResponse } from '../../../services/apis/config'
import { TipTapEditor } from '../../../components/TipTapEditor'
import styles from './BookEditForm.module.css'

export type EditFormData = {
  title: string
  summary: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
}

export interface BookEditFormBook extends Partial<Book> {
  id: string
  coverImageUrl?: string
  extraImageUrls?: string[]
}

export interface BookEditFormProps {
  book: BookEditFormBook
  categories: Category[]
  isExtraDirty: boolean
  disableActions?: boolean
  onCancel: () => void
  onSuccess: (updatedBook: BookEditFormBook) => void
}

function validate(form: EditFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.title?.trim()) errors.title = 'Tiêu đề sách không được để trống'
  if (!form.summary?.trim()) errors.summary = 'Tóm tắt không được để trống'
  if (!form.description?.trim()) errors.description = 'Mô tả sách không được để trống'
  if (!form.author?.trim()) errors.author = 'Tên tác giả không được để trống'
  if (!form.publisher?.trim()) errors.publisher = 'Tên nhà cung cấp không được để trống'
  if (!form.isbn?.trim()) errors.isbn = 'ISBN không được để trống'
  if (!form.categoryId?.trim()) errors.categoryId = 'Loại sản phẩm không được để trống'
  if (!form.publishDate?.trim()) {
    errors.publishDate = 'Ngày phát hành không được để trống'
  } else {
    const d = new Date(form.publishDate)
    if (d > new Date()) errors.publishDate = 'Ngày phát hành phải trong quá khứ hoặc hôm nay'
  }
  return errors
}

const INIT_FORM: EditFormData = {
  title: '',
  summary: '',
  description: '',
  author: '',
  publisher: '',
  isbn: '',
  categoryId: '',
  publishDate: '',
}

export function BookEditForm({
  book,
  categories,
  disableActions = false,
  onCancel,
  onSuccess,
}: BookEditFormProps) {
  const { addNotification } = useNotification()
  const [form, setForm] = useState<EditFormData>(INIT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [descriptionEditorReady, setDescriptionEditorReady] = useState(false)

  useEffect(() => {
    setDescriptionEditorReady(false)
  }, [book?.id])

  useEffect(() => {
    if (!book) return
    const categoryId = categories.find((c) => c.name === book.category?.name)?.id ?? ''
    const publishDate = book.publishDate ? book.publishDate.slice(0, 10) : ''
    setForm({
      title: book.title ?? '',
      summary: book.summary ?? '',
      description: typeof book.description === 'string' ? book.description : '',
      author: book.author ?? '',
      publisher: book.publisher ?? '',
      isbn: book.isbn ?? '',
      categoryId,
      publishDate,
    })
    setDescriptionEditorReady(true)
  }, [book, categories])

  const initialCategoryId = categories.find((c) => c.name === book.category?.name)?.id ?? ''
  const initialPublishDate = book.publishDate ? book.publishDate.slice(0, 10) : ''

  const hasFormChanges =
    form.title !== (book.title ?? '').trim() ||
    (form.summary ?? '').trim() !== (book.summary ?? '').trim() ||
    (form.description ?? '').trim() !== (book.description ?? '').trim() ||
    form.author !== (book.author ?? '').trim() ||
    form.publisher !== (book.publisher ?? '').trim() ||
    form.isbn !== (book.isbn ?? '').trim() ||
    form.categoryId !== initialCategoryId ||
    form.publishDate !== initialPublishDate

  const setField = (field: keyof EditFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!book.id) return

    setSubmitting(true)
    try {
      const res = await bookApi.updateBook(book.id, {
        title: form.title.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        isbn: form.isbn.trim(),
        categoryId: form.categoryId,
        publishDate: form.publishDate,
      })
      const apiRes = res as APISuccessResponse<Book>
      const data = apiRes.data
      if (!data || typeof data !== 'object') return
      const updatedBook: BookEditFormBook = {
        ...data,
        coverImageUrl: book.coverImageUrl,
        extraImageUrls: book.extraImageUrls,
      }
      onSuccess(updatedBook)
      addNotification('success', `Đã cập nhật "${updatedBook.title}".`)
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (err as { error?: string })?.error ??
        'Cập nhật thất bại.'
      addNotification('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || disableActions

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
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
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Nhập tiêu đề sách"
                disabled={disabled}
              />
              {errors.title && <span className={styles.formError}>{errors.title}</span>}
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
                onChange={(e) => setField('author', e.target.value)}
                placeholder="Tên tác giả"
                disabled={disabled}
              />
              {errors.author && <span className={styles.formError}>{errors.author}</span>}
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
                onChange={(e) => setField('categoryId', e.target.value)}
                disabled={disabled}
                title="Chọn danh mục sách trong danh sách"
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className={styles.formError}>{errors.categoryId}</span>}
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
                onChange={(e) => setField('publisher', e.target.value)}
                placeholder="Tên nhà xuất bản / cung cấp"
                disabled={disabled}
              />
              {errors.publisher && <span className={styles.formError}>{errors.publisher}</span>}
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
                onChange={(e) => setField('isbn', e.target.value)}
                placeholder="978-604-1-00001-1"
                disabled={disabled}
              />
              {errors.isbn && <span className={styles.formError}>{errors.isbn}</span>}
            </div>
            <div className={styles.formField}>
              <label htmlFor="edit-publishDate" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                <FiCalendar className={styles.formLabelIcon} aria-hidden />
                Ngày phát hành <span className={styles.required}>*</span>
              </label>
              <span id="edit-publishDate-hint" className={styles.formInputHint}>
                Chọn ngày trên lịch — không được là ngày tương lai
              </span>
              <input
                id="edit-publishDate"
                type="date"
                className={styles.formInput}
                value={form.publishDate}
                onChange={(e) => setField('publishDate', e.target.value)}
                disabled={disabled}
                title="Chọn ngày phát hành trên lịch (bắt buộc)"
                aria-describedby="edit-publishDate-hint"
              />
              {errors.publishDate && <span className={styles.formError}>{errors.publishDate}</span>}
            </div>
          </div>
        </section>

        <section className={`${styles.formSection} ${styles.formSectionSummary}`}>
          <h3 className={styles.formSectionTitleCard}>
            <FiFileText className={styles.formSectionTitleIcon} aria-hidden />
            Tóm tắt <span className={styles.required}>*</span>
          </h3>
          <div className={styles.formField}>
            <label htmlFor="edit-summary" className={styles.formLabel}>
              Tóm tắt ngắn về nội dung sách
            </label>
            <textarea
              id="edit-summary"
              className={styles.formTextarea}
              value={form.summary}
              onChange={(e) => setField('summary', e.target.value)}
              placeholder="Nhập tóm tắt (văn bản thuần)"
              rows={4}
              disabled={disabled}
            />
            {errors.summary && <span className={styles.formError}>{errors.summary}</span>}
          </div>
        </section>

        <section className={`${styles.formSection} ${styles.formSectionDescription}`}>
          <h3 className={styles.formSectionTitleCard}>
            <FiFileText className={styles.formSectionTitleIcon} aria-hidden />
            Mô tả sách <span className={styles.required}>*</span>
          </h3>
          <div className={`${styles.formField} ${styles.descriptionEditorWrap}`}>
            {descriptionEditorReady ? (
              <TipTapEditor
                key={book.id}
                id="edit-description"
                value={form.description}
                onChange={(html) => setField('description', html)}
                placeholder="Mô tả ngắn (in đậm, in nghiêng, danh sách, link...)"
                disabled={disabled}
              />
            ) : (
              <div className={styles.descriptionEditorSkeleton}>Đang tải nội dung mô tả…</div>
            )}
            {errors.description && <span className={styles.formError}>{errors.description}</span>}
          </div>
        </section>
      </div>

      <div className={styles.editFormFooter}>
        <button type="button" className={styles.formBtnCancel} onClick={onCancel} disabled={disabled}>
          <FiX aria-hidden /> Hủy
        </button>
        <button type="submit" className={styles.formBtnSubmit} disabled={disabled || !hasFormChanges}>
          {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}

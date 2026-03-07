import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  FiArrowLeft,
  FiEdit2,
  FiX,
  FiUser,
  FiHash,
  FiTag,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiImage,
  FiPlus,
  FiBook,
  FiPackage,
} from 'react-icons/fi'
import { useNotification } from '../../../contexts/NotificationContext'
import type { Book as EntityBook } from '../../../services/entities/Book'
import type { Category } from '../../../services/entities/Category'
import bookApi from '../../../services/apis/bookApi'
import categoryApi from '../../../services/apis/CategoryApi'
import { TipTapEditor } from '../../../components/TipTapEditor'
import styles from './BookDetail.module.css'

type EditFormData = {
  title: string
  description: string
  author: string
  publisher: string
  isbn: string
  categoryId: string
  publishDate: string
}

type Book = EntityBook & {
  coverImageUrl?: string
  extraImageUrls?: string[]
  categoryName?: string
}

function getCurrentPrice(book?: Book | null): number | null {
  if (!book?.price) return null
  return book.price.price
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function getCategoryName(book: Book): string {
  return book.category?.name ?? '—'
}

const MAX_EXTRA_IMAGES = 5

function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { addNotification } = useNotification()

  const bookFromState = (location.state as { book?: Book })?.book

  const [book, setBook] = useState<Book | undefined>(bookFromState)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    description: '',
    author: '',
    publisher: '',
    isbn: '',
    categoryId: '',
    publishDate: '',
  })
  const [editFormErrors, setEditFormErrors] = useState<Partial<Record<keyof EditFormData, string>>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!id) return
    if (bookFromState) {
      setBook(bookFromState)
    }

    bookApi
      .findBookById(id)
      .then((res: { data?: unknown }) => {
        const raw = res.data as Record<string, unknown>
        const anyBook = raw as any
        const createdAt = anyBook.createdAt ?? anyBook.created_at ?? ''
        const mapped = { ...anyBook, createdAt } as Book
        setBook(mapped)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? `Không tìm thấy sách với mã "${id}".`
        addNotification('error', msg)
        setBook(undefined)
      })
  }, [id, bookFromState, addNotification])

  useEffect(() => {
    if (!book) return
    setExtraImages(book.extraImageUrls ?? [])
    const categoryName = book.category?.name ?? book.categoryName ?? ''
    const matchedCategoryId =
      categories.find((c) => c.name === categoryName)?.id ?? ''
    setEditForm({
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      publisher: book.publisher ?? '',
      isbn: book.isbn ?? '',
      categoryId: matchedCategoryId,
      publishDate: book.publishDate ? book.publishDate.slice(0, 10) : '',
    })
  }, [book, categories])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const displayImageUrl = imagePreviewUrl ?? book?.coverImageUrl ?? null
  const showCoverPlaceholder = !displayImageUrl || imageError

  useEffect(() => {
    setImageError(false)
  }, [displayImageUrl])

  useEffect(() => {
    categoryApi
      .getCategories({
        page: 0,
        pageSize: 1000,
        orderBy: 'ASC',
        sortBy: 'name',
      })
      .then((res: { data?: unknown }) => {
        const data = (res.data ?? []) as Category[]
        setCategories(data)
      })
      .catch((error: { message?: string; error?: string }) => {
        const msg = error?.message ?? error?.error ?? 'Không thể tải danh mục sách.'
        addNotification('error', msg)
        setCategories([])
      })
  }, [addNotification])

  const handleBack = () => navigate('/products')

  const handleStartEdit = () => {
    setEditFormErrors({})
    setImageFile(null)
    setImagePreviewUrl(null)
    setExtraImages(book?.extraImageUrls ?? [])
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setImageFile(null)
    setImagePreviewUrl(null)
    setExtraImages(book?.extraImageUrls ?? [])
    setEditFormErrors({})
  }

  const handleSaveExtraImages = () => {
    if (!book) return
    const saved = book.extraImageUrls ?? []
    const dirty = saved.length !== extraImages.length || saved.some((v, i) => v !== extraImages[i])
    if (!dirty) return
    setBook((b) => (b ? { ...b, extraImageUrls: extraImages } : b))
    addNotification('success', 'Đã lưu ảnh phụ.')
  }

  const validateEditForm = (data: EditFormData): Partial<Record<keyof EditFormData, string>> => {
    const err: Partial<Record<keyof EditFormData, string>> = {}
    if (!data.title?.trim()) err.title = 'Tiêu đề sách không được để trống'
    if (!data.description?.trim()) err.description = 'Mô tả sách không được để trống'
    if (!data.author?.trim()) err.author = 'Tên tác giả không được để trống'
    if (!data.publisher?.trim()) err.publisher = 'Tên nhà cung cấp không được để trống'
    if (!data.isbn?.trim()) err.isbn = 'ISBN không được để trống'
    if (!data.categoryId?.trim()) err.categoryId = 'Loại sản phẩm không được để trống'
    if (!data.publishDate?.trim()) err.publishDate = 'Ngày phát hành không được để trống'
    else {
      const d = new Date(data.publishDate)
      if (d > new Date()) err.publishDate = 'Ngày phát hành phải bằng hoặc trong quá khứ'
    }
    return err
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateEditForm(editForm)
    setEditFormErrors(err)
    if (Object.keys(err).length > 0) return
    if (!book) return
    setSubmitting(true)
    const applyUpdate = (newCoverUrl: string | undefined) => {
      bookApi
        .updateBook(book.id, {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          author: editForm.author.trim(),
          publisher: editForm.publisher.trim(),
          isbn: editForm.isbn.trim(),
          categoryId: editForm.categoryId,
          publishDate: editForm.publishDate,
        })
        .then((res: { data?: unknown }) => {
          const raw = res.data as Record<string, unknown>
          const anyBook = raw as any
          const createdAt = anyBook.createdAt ?? anyBook.created_at ?? ''
          const mapped: Book = {
            ...anyBook,
            createdAt,
            coverImageUrl: newCoverUrl ?? anyBook.coverImageUrl ?? book.coverImageUrl,
            extraImageUrls: extraImages,
          }
          setBook(mapped)
          setIsEditing(false)
          setImageFile(null)
          setImagePreviewUrl(null)
          addNotification('success', `Đã cập nhật sách "${mapped.title}".`)
        })
        .catch((error: { message?: string; error?: string }) => {
          const msg = error?.message ?? error?.error ?? 'Cập nhật sách thất bại.'
          addNotification('error', msg)
        })
        .finally(() => {
          setSubmitting(false)
        })
    }

    if (imageFile) {
      const reader = new FileReader()
      reader.onload = () => {
        applyUpdate(typeof reader.result === 'string' ? reader.result : undefined)
      }
      reader.onerror = () => {
        applyUpdate(book.coverImageUrl)
        addNotification('error', 'Không đọc được ảnh; đã lưu các thông tin khác.')
      }
      reader.readAsDataURL(imageFile)
    } else {
      applyUpdate(book.coverImageUrl)
    }
  }

  const handleAddExtraImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const currentCount = extraImages.length
    const remaining = MAX_EXTRA_IMAGES - currentCount
    if (remaining <= 0) {
      addNotification('error', `Mỗi sách tối đa ${MAX_EXTRA_IMAGES} ảnh phụ. Đã đủ số lượng.`)
      e.target.value = ''
      return
    }
    const fileList = Array.from(files)
    const validFiles: File[] = []
    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        addNotification('error', `Bỏ qua "${file.name}" – chỉ chấp nhận file ảnh.`)
        return
      }
      validFiles.push(file)
    })
    const toProcess = validFiles.slice(0, remaining)
    if (validFiles.length > remaining) {
      addNotification('info', `Chỉ thêm được tối đa ${remaining} ảnh nữa. Đã bỏ qua ${validFiles.length - remaining} ảnh.`)
    }
    if (toProcess.length === 0) {
      e.target.value = ''
      return
    }
    const toAdd: string[] = []
    let done = 0
    const total = toProcess.length
    toProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') toAdd.push(reader.result)
        if (++done === total) {
          setExtraImages((prev) => {
            const space = MAX_EXTRA_IMAGES - prev.length
            return [...prev, ...toAdd.slice(0, space)]
          })
        }
      }
      reader.onerror = () => {
        if (++done === total) {
          setExtraImages((prev) => {
            const space = MAX_EXTRA_IMAGES - prev.length
            return [...prev, ...toAdd.slice(0, space)]
          })
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleRemoveExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveSavedExtraImage = (url: string) => {
    setExtraImages((prev) => {
      const idx = prev.indexOf(url)
      if (idx === -1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
    } else if (file) {
      addNotification('error', 'Vui lòng chọn file ảnh (JPG, PNG, ...)')
    }
    e.target.value = ''
  }

  const removeNewImage = () => {
    setImageFile(null)
  }

  if (!id) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Thiếu mã sách.</p>
        <button type="button" className={styles.btnSecondary} onClick={handleBack}>
          <FiArrowLeft aria-hidden /> Quay lại danh sách
        </button>
      </div>
    )
  }

  if (!book) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Không tìm thấy sách với mã "{id}".</p>
        <button type="button" className={styles.btnSecondary} onClick={handleBack}>
          <FiArrowLeft aria-hidden /> Quay lại danh sách
        </button>
      </div>
    )
  }

  const price = getCurrentPrice(book)
  const savedExtraImages = book.extraImageUrls ?? []
  const isExtraDirty =
    savedExtraImages.length !== extraImages.length ||
    savedExtraImages.some((v, i) => v !== extraImages[i])

  const initialCategoryId =
    categories.find((c) => c.name === getCategoryName(book))?.id ?? ''
  const isEditDirty =
    editForm.title !== (book.title ?? '').trim() ||
    (editForm.description ?? '').trim() !== (book.description ?? '').trim() ||
    editForm.author !== (book.author ?? '').trim() ||
    editForm.publisher !== (book.publisher ?? '').trim() ||
    editForm.isbn !== (book.isbn ?? '').trim() ||
    editForm.categoryId !== initialCategoryId ||
    editForm.publishDate !== (book.publishDate ? book.publishDate.slice(0, 10) : '') ||
    imageFile !== null ||
    isExtraDirty

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label="Quay lại danh sách sách"
        >
          <FiArrowLeft aria-hidden /> Quay lại danh sách
        </button>
      </header>

      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.coverCol}>
            <div className={styles.coverCard}>
              {showCoverPlaceholder ? (
                <div className={styles.coverPlaceholder} aria-hidden>
                  <FiImage className={styles.coverPlaceholderIcon} />
                </div>
              ) : (
                <img
                  src={displayImageUrl}
                  alt={`Bìa: ${book.title}`}
                  className={styles.coverImg}
                  onError={() => setImageError(true)}
                />
              )}
              {isEditing && (
                <div className={styles.imageActionsOverlay}>
                  <label className={styles.uploadLabel}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.fileInput}
                      aria-label="Chọn ảnh bìa mới"
                    />
                    <FiImage aria-hidden /> Thêm ảnh
                  </label>
                  {imageFile && (
                    <button type="button" className={styles.removeImageBtn} onClick={removeNewImage}>
                      Xóa ảnh
                    </button>
                  )}
                </div>
              )}
            </div>
            <section className={styles.extraSection} aria-label="Ảnh phụ">
              <div
                className={
                  isEditing && isExtraDirty
                    ? `${styles.extraSectionHeader} ${styles.extraSectionHeaderTwoRows}`
                    : styles.extraSectionHeader
                }
              >
                <div className={styles.extraSectionFirstRow}>
                  <div className={styles.extraSectionTitleRow}>
                    <FiImage className={styles.extraSectionIcon} aria-hidden />
                    <h2 className={styles.extraSectionTitle}>Ảnh phụ</h2>
                  </div>
                  {isEditing && !isExtraDirty && (
                    <div className={styles.extraSectionActions}>
                      <label
                        className={
                          extraImages.length >= MAX_EXTRA_IMAGES
                            ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}`
                            : styles.extraAddHeader
                        }
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddExtraImages}
                          className={styles.fileInput}
                          aria-label="Thêm ảnh phụ"
                          disabled={extraImages.length >= MAX_EXTRA_IMAGES}
                        />
                        <FiPlus className={styles.extraAddHeaderIcon} aria-hidden />
                        <span>Thêm ảnh</span>
                      </label>
                    </div>
                  )}
                </div>
                {isEditing && isExtraDirty && (
                  <div className={styles.extraSectionActionsRow}>
                    <div className={styles.extraSectionActions}>
                      <label
                        className={
                          extraImages.length >= MAX_EXTRA_IMAGES
                            ? `${styles.extraAddHeader} ${styles.extraAddHeaderDisabled}`
                            : styles.extraAddHeader
                        }
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddExtraImages}
                          className={styles.fileInput}
                          aria-label="Thêm ảnh phụ"
                          disabled={extraImages.length >= MAX_EXTRA_IMAGES}
                        />
                        <FiPlus className={styles.extraAddHeaderIcon} aria-hidden />
                        <span>Thêm ảnh</span>
                      </label>
                      <button
                        type="button"
                        className={styles.extraSectionSave}
                        onClick={handleSaveExtraImages}
                      >
                        Lưu ảnh phụ
                      </button>
                    </div>
                  </div>
                )}
                {isEditing && (
                  <p className={styles.extraSectionHint}>
                    {extraImages.length >= MAX_EXTRA_IMAGES
                      ? `Đã đủ ${MAX_EXTRA_IMAGES} ảnh phụ.`
                      : `Có thể thêm tối đa ${MAX_EXTRA_IMAGES - extraImages.length} ảnh nữa (tối đa ${MAX_EXTRA_IMAGES} ảnh phụ).`}
                  </p>
                )}
              </div>
              {isEditing ? (
                <>
                  {extraImages.length > 0 ? (
                    <div className={styles.extraPart}>
                      <h3 className={styles.extraPartTitle}>Ảnh đang chờ cập nhật</h3>
                      <div className={styles.extraGrid}>
                        {extraImages.map((url, index) => (
                          <div key={`extra-${index}`} className={styles.extraThumbWrap}>
                            <img
                              src={url}
                              alt={`Ảnh phụ ${index + 1}`}
                              className={styles.extraThumbImg}
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect fill="%23e2e8f0" width="120" height="120"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3ELỗi%3C/text%3E%3C/svg%3E'
                              }}
                            />
                            <button
                              type="button"
                              className={styles.extraThumbRemove}
                              onClick={() => handleRemoveExtraImage(index)}
                              aria-label={`Xóa ảnh phụ ${index + 1}`}
                              title="Xóa ảnh"
                            >
                              <FiX aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.extraPart}>
                      <h3 className={styles.extraPartTitle}>Danh sách ảnh</h3>
                      {savedExtraImages.length > 0 ? (
                        <div className={styles.extraGrid}>
                          {savedExtraImages.map((url, index) => (
                            <div key={`saved-${index}`} className={styles.extraThumbWrap}>
                              <img
                                src={url}
                                alt={`Ảnh đã lưu ${index + 1}`}
                                className={styles.extraThumbImg}
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect fill="%23e2e8f0" width="120" height="120"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3ELỗi%3C/text%3E%3C/svg%3E'
                                }}
                              />
                              <button
                                type="button"
                                className={styles.extraThumbRemove}
                                onClick={() => handleRemoveSavedExtraImage(url)}
                                aria-label={`Xóa ảnh phụ ${index + 1}`}
                                title="Xóa ảnh"
                              >
                                <FiX aria-hidden />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.extraEmpty}>Chưa có ảnh nào trên hệ thống.</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(book?.extraImageUrls?.length ?? 0) > 0 ? (
                    <div className={styles.extraGridView}>
                      {(book?.extraImageUrls ?? []).map((url, index) => (
                        <div key={`extra-view-${index}`} className={styles.extraThumbWrapView}>
                          <img
                            src={url}
                            alt={`Ảnh phụ ${index + 1}`}
                            className={styles.extraThumbImg}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect fill="%23e2e8f0" width="120" height="120"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3ELỗi%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.extraEmpty}>
                      Chưa có ảnh phụ. Nhấn <strong>Chỉnh sửa</strong> để thêm ảnh.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
          <div className={styles.detailCol}>
            {!isEditing ? (
              <div className={styles.detailViewWrap}>
                <div className={styles.detailView}>
                  <header className={styles.detailHead}>
                    <h1 className={styles.bookTitle}>{book.title}</h1>
                    <p className={styles.bookAuthor}>
                      <FiUser className={styles.metaIcon} aria-hidden />
                      {book.author}
                    </p>
                    {price != null && (
                      <div className={styles.priceBadge}>
                        <FiDollarSign aria-hidden />
                        {formatCurrency(price)}
                      </div>
                    )}
                  </header>

                  <section className={styles.detailInfoCard} aria-label="Thông tin sách">
                  <div className={styles.detailMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FiTag aria-hidden /> Thể loại</span>
                      <span className={styles.metaValue}>{getCategoryName(book)}</span>
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
                      <span className={styles.metaValue}>{formatDate(book.publishDate)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}><FiCalendar aria-hidden /> Ngày tạo</span>
                      <span className={styles.metaValue}>{formatDate(book.createdAt)}</span>
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
                <div className={styles.detailViewFooter}>
                  <button
                    type="button"
                    className={styles.editBtnFooter}
                    onClick={handleStartEdit}
                    aria-label="Chỉnh sửa sách"
                  >
                    <FiEdit2 aria-hidden /> Chỉnh sửa
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className={styles.editForm}>
                <div className={styles.editFormBody}>
                  {/* Thông tin cơ bản: chỉ Tiêu đề + Tác giả */}
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
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Nhập tiêu đề sách"
                          disabled={submitting}
                        />
                        {editFormErrors.title && (
                          <span className={styles.formError}>{editFormErrors.title}</span>
                        )}
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
                          value={editForm.author}
                          onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))}
                          placeholder="Tên tác giả"
                          disabled={submitting}
                        />
                        {editFormErrors.author && (
                          <span className={styles.formError}>{editFormErrors.author}</span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Thông tin xuất bản */}
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
                          value={editForm.publisher}
                          onChange={(e) => setEditForm((f) => ({ ...f, publisher: e.target.value }))}
                          placeholder="Tên nhà xuất bản / cung cấp"
                          disabled={submitting}
                        />
                        {editFormErrors.publisher && (
                          <span className={styles.formError}>{editFormErrors.publisher}</span>
                        )}
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
                          value={editForm.isbn}
                          onChange={(e) => setEditForm((f) => ({ ...f, isbn: e.target.value }))}
                          placeholder="978-604-1-00001-1"
                          disabled={submitting}
                        />
                        {editFormErrors.isbn && (
                          <span className={styles.formError}>{editFormErrors.isbn}</span>
                        )}
                      </div>
                      <div className={styles.formField}>
                        <label htmlFor="edit-categoryId" className={`${styles.formLabel} ${styles.formLabelWithIcon}`}>
                          <FiTag className={styles.formLabelIcon} aria-hidden />
                          Danh mục <span className={styles.required}>*</span>
                        </label>
                        <select
                          id="edit-categoryId"
                          className={styles.formSelect}
                          value={editForm.categoryId}
                          onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}
                          disabled={submitting}
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {editFormErrors.categoryId && (
                          <span className={styles.formError}>{editFormErrors.categoryId}</span>
                        )}
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
                          value={editForm.publishDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, publishDate: e.target.value }))}
                          disabled={submitting}
                        />
                        {editFormErrors.publishDate && (
                          <span className={styles.formError}>{editFormErrors.publishDate}</span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Mô tả — đặt ở dưới cùng */}
                  <section className={`${styles.formSection} ${styles.formSectionDescription}`}>
                    <h3 className={styles.formSectionTitleCard}>
                      <FiFileText className={styles.formSectionTitleIcon} aria-hidden />
                      Mô tả sách <span className={styles.required}>*</span>
                    </h3>
                    <div className={`${styles.formField} ${styles.descriptionEditorWrap}`}>
                      <TipTapEditor
                        id="edit-description"
                        value={editForm.description}
                        onChange={(html) => setEditForm((f) => ({ ...f, description: html }))}
                        placeholder="Mô tả ngắn về nội dung sách (có thể dùng in đậm, in nghiêng, danh sách, link)"
                        disabled={submitting}
                      />
                      {editFormErrors.description && (
                        <span className={styles.formError}>{editFormErrors.description}</span>
                      )}
                    </div>
                  </section>
                </div>
                <div className={styles.editFormFooter}>
                  <button
                    type="button"
                    className={styles.formBtnCancel}
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    <FiX aria-hidden /> Hủy
                  </button>
                  <button
                    type="submit"
                    className={styles.formBtnSubmit}
                    disabled={submitting || !isEditDirty}
                  >
                    {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail

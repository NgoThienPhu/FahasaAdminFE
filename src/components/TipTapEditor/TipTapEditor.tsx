import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Editor } from '@tiptap/core'
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaLink,
  FaQuoteRight,
  FaCode,
  FaMinus,
  FaUndo,
  FaRedo,
  FaHeading,
  FaParagraph,
} from 'react-icons/fa'
import styles from './TipTapEditor.module.css'

const EMPTY_HTML = '<p></p>'

function normalizeHtml(html: string): string {
  const t = html?.trim() || ''
  return t === '' ? EMPTY_HTML : html
}

export type TipTapEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl || 'https://')
    if (url == null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Hoàn tác"
          tabIndex={-1}
        >
          <FaUndo className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Làm lại"
          tabIndex={-1}
        >
          <FaRedo className={styles.icon} aria-hidden />
        </button>
      </div>
      <div className={styles.toolbarDivider} aria-hidden />
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
          title="In đậm"
          tabIndex={-1}
        >
          <FaBold className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
          title="In nghiêng"
          tabIndex={-1}
        >
          <FaItalic className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-active={editor.isActive('strike')}
          title="Gạch ngang"
          tabIndex={-1}
        >
          <FaStrikethrough className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-active={editor.isActive('code')}
          title="Mã code"
          tabIndex={-1}
        >
          <FaCode className={styles.icon} aria-hidden />
        </button>
      </div>
      <div className={styles.toolbarDivider} aria-hidden />
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          data-active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Đoạn văn"
          tabIndex={-1}
        >
          <FaParagraph className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          data-active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Tiêu đề 1"
          tabIndex={-1}
        >
          <FaHeading className={styles.icon} aria-hidden />
          <span className={styles.headingLevel}>1</span>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          data-active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Tiêu đề 2"
          tabIndex={-1}
        >
          <FaHeading className={styles.icon} aria-hidden />
          <span className={styles.headingLevel}>2</span>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          data-active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Tiêu đề 3"
          tabIndex={-1}
        >
          <FaHeading className={styles.icon} aria-hidden />
          <span className={styles.headingLevel}>3</span>
        </button>
      </div>
      <div className={styles.toolbarDivider} aria-hidden />
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
          title="Danh sách dấu chấm"
          tabIndex={-1}
        >
          <FaListUl className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
          title="Danh sách số"
          tabIndex={-1}
        >
          <FaListOl className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={setLink}
          data-active={editor.isActive('link')}
          title="Chèn link"
          tabIndex={-1}
        >
          <FaLink className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
          title="Trích dẫn"
          tabIndex={-1}
        >
          <FaQuoteRight className={styles.icon} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Đường kẻ ngang"
          tabIndex={-1}
        >
          <FaMinus className={styles.icon} aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  id,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === EMPTY_HTML ? '' : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  useEffect(() => {
    if (!editor) return
    const normalized = normalizeHtml(value)
    const current = editor.getHTML()
    if (normalized === current) return
    editor.commands.setContent(normalized, { emitUpdate: false })
  }, [editor, value])

  if (!editor) return null

  return (
    <div id={id} className={`${styles.wrap} ${className ?? ''}`.trim()}>
      <Toolbar editor={editor} />
      <div className={styles.editor}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Search, FileText, Trash2, Save, X } from 'lucide-react'
import { apiFetch } from '../../belumiApi'
import { MarkdownContent, slugify } from '../../App'

const emptyNews = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverImageUrl: '',
  category: 'Skincare',
  tags: '',
  author: 'Belumi Team',
  status: 'Published',
}

const NEWS_STATUS_VALUES = {
  Draft: 0,
  Published: 1,
  Hidden: 2,
}

const NEWS_STATUS_LABELS = {
  0: 'Draft',
  1: 'Published',
  2: 'Hidden',
  Draft: 'Draft',
  Published: 'Published',
  Hidden: 'Hidden',
}

function normalizeNewsStatus(status) {
  return NEWS_STATUS_LABELS[status] || 'Published'
}

function serializeNewsStatus(status) {
  return NEWS_STATUS_VALUES[normalizeNewsStatus(status)]
}

export default function AdminNewsTab({ token, showToast }) {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyNews)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState('write')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search.trim()) params.set('search', search.trim())
    return params.toString() ? `?${params.toString()}` : ''
  }, [status, search])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const newsData = await apiFetch(`/admin/news${query}`, { token })
      const catData = await apiFetch('/admin/news-categories', { token })
      setNews(newsData || [])
      setCategories(catData || [])
    } catch (err) {
      setError(err.message || 'Không tải được tin tức.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 250)
    return () => clearTimeout(timer)
  }, [query])

  const editPost = (post) => {
    setSelected(post)
    setEditorOpen(true)
    setEditorMode('write')
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      summary: post.summary || '',
      content: post.content || '',
      coverImageUrl: post.coverImageUrl || '',
      category: post.category || 'Skincare',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
      author: post.author || 'Belumi Team',
      status: normalizeNewsStatus(post.status),
      publishedAt: post.publishedAt || '',
    })
  }

  const resetForm = () => {
    setSelected(null)
    setForm(emptyNews)
    setEditorMode('write')
    setEditorOpen(false)
  }

  const createPost = () => {
    setSelected(null)
    setForm({ ...emptyNews, category: categories[0]?.name || 'Skincare' })
    setEditorMode('write')
    setEditorOpen(true)
  }

  const savePost = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      setError('Vui lòng nhập đủ Tiêu đề, Tóm tắt và Nội dung trước khi lưu bài viết.')
      return
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags,
      status: serializeNewsStatus(form.status),
      publishedAt: form.publishedAt || new Date().toISOString(),
      isActive: form.status !== 'Hidden',
    }

    try {
      if (selected) {
        await apiFetch(`/admin/news/${selected.id}`, {
          method: 'PUT',
          body: { ...selected, ...payload },
          token,
        })
        showToast('Đã cập nhật bài viết.')
      } else {
        await apiFetch('/admin/news', {
          method: 'POST',
          body: payload,
          token,
        })
        showToast('Đã tạo bài viết mới.')
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Không lưu được bài viết.')
    }
  }

  const updateForm = (name, value) => {
    setForm((prev) => {
      if (name === 'title' && (!prev.slug || prev.slug === slugify(prev.title))) {
        return { ...prev, title: value, slug: slugify(value) }
      }
      return { ...prev, [name]: value }
    })
  }

  const deletePost = async (post) => {
    if (!window.confirm(`Ẩn bài viết "${post.title}"?`)) return
    try {
      await apiFetch(`/admin/news/${post.id}`, {
        method: 'DELETE',
        token,
      })
      showToast('Đã ẩn bài viết.')
      await loadData()
    } catch (err) {
      showToast(err.message || 'Không xóa được bài viết.', 'error')
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Bài viết / Tin tức</h1>
        <button className="primary-btn" onClick={createPost} type="button">Tạo bài viết</button>
      </div>

      <div className="filter-bar">
        <label className="search-box">
          <Search size={18} />
          <input
            placeholder="Tìm theo tiêu đề, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Hidden">Hidden</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải tin tức...</div>
      ) : (
        <div className="admin-list">
          {news.length === 0 ? (
            <p className="admin-empty-note">Chưa có bài viết phù hợp.</p>
          ) : (
            news.map((post) => (
              <article className="admin-news-item" key={post.id}>
                <div>
                  <span className={`badge plan-${normalizeNewsStatus(post.status).toLowerCase()}`}>
                    {normalizeNewsStatus(post.status)}
                  </span>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <small>Danh mục: <strong>{post.category}</strong> | Lượt xem: {post.viewCount || 0}</small>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => editPost(post)} className="edit-btn">
                    <FileText size={16} /> Sửa
                  </button>
                  <button type="button" onClick={() => deletePost(post)} className="ban-btn">
                    <Trash2 size={16} /> Ẩn
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {editorOpen && (
        <div className="modal-backdrop admin-editor-backdrop" role="presentation">
          <form className="admin-editor-modal" noValidate onSubmit={savePost}>
            <div className="admin-editor-head">
              <div>
                <p className="eyebrow">Markdown editor</p>
                <h2>{selected ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}</h2>
              </div>
              <button className="modal-close" type="button" onClick={resetForm}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-editor-grid">
              <div className="admin-meta-fields">
                <AdminInput
                  label="Tiêu đề"
                  name="title"
                  form={form}
                  updateForm={updateForm}
                  required
                />
                <AdminInput label="Slug" name="slug" form={form} updateForm={updateForm} />
                <AdminInput
                  label="Tóm tắt"
                  name="summary"
                  form={form}
                  updateForm={updateForm}
                  required
                />
                <AdminInput
                  label="Ảnh bìa URL"
                  name="coverImageUrl"
                  form={form}
                  updateForm={updateForm}
                />
                <label htmlFor="news-category">Danh mục bài viết</label>
                <select
                  id="news-category"
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="Skincare">Skincare</option>}
                </select>
                <AdminInput label="Tags" name="tags" form={form} updateForm={updateForm} />
                <label htmlFor="news-status">Trạng thái bài viết</label>
                <select
                  id="news-status"
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>

              <div className="admin-content-editor">
                <div className="editor-tabs" aria-label="Chế độ soạn thảo">
                  <button
                    className={editorMode === 'write' ? 'is-active' : undefined}
                    type="button"
                    onClick={() => setEditorMode('write')}
                  >
                    Viết Markdown
                  </button>
                  <button
                    className={editorMode === 'preview' ? 'is-active' : undefined}
                    type="button"
                    onClick={() => setEditorMode('preview')}
                  >
                    Xem trước
                  </button>
                </div>
                {editorMode === 'write' ? (
                  <>
                    <label htmlFor="news-content">Nội dung bài viết</label>
                    <textarea
                      id="news-content"
                      value={form.content}
                      onChange={(event) => updateForm('content', event.target.value)}
                      placeholder={'## Đề mục lớn\\n\\nNội dung viết dạng **chữ đậm**, *chữ nghiêng*, [liên kết](https://example.com)...'}
                      required
                      rows={18}
                    />
                  </>
                ) : (
                  <article className="markdown-preview">
                    <header>
                      <p className="eyebrow">{form.category || 'Blogs / News'}</p>
                      <h1>{form.title || 'Tiêu đề bài viết'}</h1>
                      {form.summary && <p>{form.summary}</p>}
                    </header>
                    {form.coverImageUrl && <img src={form.coverImageUrl} alt="" />}
                    <MarkdownContent content={form.content || 'Chưa nhập nội dung.'} />
                  </article>
                )}
              </div>
            </div>

            <div className="admin-editor-actions">
              <div className="admin-editor-feedback">
                {error && <p className="form-error">{error}</p>}
                {message && <p className="form-success">{message}</p>}
              </div>
              <button type="button" onClick={resetForm}>Hủy</button>
              <button className="primary-btn" type="submit">
                <Save size={17} /> Lưu bài viết
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function AdminInput({ label, name, form, updateForm, required }) {
  return (
    <>
      <label htmlFor={`news-${name}`}>{label}</label>
      <input
        id={`news-${name}`}
        value={form[name] || ''}
        onChange={(event) => updateForm(name, event.target.value)}
        required={required}
      />
    </>
  )
}

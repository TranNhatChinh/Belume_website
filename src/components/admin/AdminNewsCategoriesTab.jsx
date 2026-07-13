import React, { useState, useEffect } from 'react'
import { Edit, Trash2, X } from 'lucide-react'
import { apiFetch } from '../../belumiApi'
import { slugify } from '../../App'

const emptyNewsCategory = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
}

export default function AdminNewsCategoriesTab({ token, showToast }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyNewsCategory)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/admin/news-categories', { token })
      setCategories(data || [])
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh mục bài viết.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [token])

  const startCreate = () => {
    setSelected(null)
    setForm(emptyNewsCategory)
    setModalOpen(true)
  }

  const startEdit = (c) => {
    setSelected(c)
    setForm({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      isActive: c.isActive ?? true,
    })
    setModalOpen(true)
  }

  const saveCategory = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
      }
      if (selected) {
        await apiFetch(`/admin/news-categories/${selected.id}`, {
          method: 'PUT',
          token,
          body: { ...selected, ...payload }
        })
        showToast('Đã cập nhật danh mục.')
      } else {
        await apiFetch('/admin/news-categories', {
          method: 'POST',
          token,
          body: payload
        })
        showToast('Đã tạo danh mục mới.')
      }
      setModalOpen(false)
      await loadCategories()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu danh mục.', 'error')
    }
  }

  const deleteCategory = async (c) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return
    try {
      await apiFetch(`/admin/news-categories/${c.id}`, {
        method: 'DELETE',
        token
      })
      showToast('Đã ẩn/xóa danh mục.')
      await loadCategories()
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa danh mục.', 'error')
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Danh mục Bài viết</h1>
        <button className="primary-btn" onClick={startCreate} type="button">Tạo danh mục</button>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải danh mục...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Chưa có danh mục nào.</td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><code>{c.slug}</code></td>
                    <td>{c.description || 'Chưa có mô tả'}</td>
                    <td>
                      <span className={`badge status-${c.isActive ? 'active' : 'banned'}`}>
                        {c.isActive ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" onClick={() => startEdit(c)} className="edit-btn">
                          <Edit size={14} /> Sửa
                        </button>
                        <button type="button" onClick={() => deleteCategory(c)} className="ban-btn">
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="login-modal" onSubmit={saveCategory}>
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
            <p className="eyebrow">Category form</p>
            <h2>{selected ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>

            <label htmlFor="cat-name">Tên danh mục</label>
            <input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
              required
            />

            <label htmlFor="cat-slug">Slug</label>
            <input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />

            <label htmlFor="cat-desc">Mô tả</label>
            <textarea
              id="cat-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="admin-editor-actions">
              <button type="button" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="primary-btn" type="submit">Lưu danh mục</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

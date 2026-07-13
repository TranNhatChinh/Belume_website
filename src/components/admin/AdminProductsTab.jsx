import React, { useState, useEffect } from 'react'
import { Search, Edit, Trash2, X, Save } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

const emptyProduct = {
  name: '',
  brand: 'Belumi',
  description: '',
  ingredients: '',
  benefits: '',
  price: 0,
  thumbnailUrl: '',
  imageUrl: '',
  suitableSkinTypes: '',
  categoryId: '',
}

export default function AdminProductsTab({ token, showToast }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const pData = await apiFetch('/products')
      const cData = await apiFetch('/categories')
      setProducts(pData || [])
      setCategories(cData || [])
    } catch (err) {
      showToast(err.message || 'Lỗi tải dữ liệu sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const startCreate = () => {
    setSelected(null)
    setForm({ ...emptyProduct, categoryId: categories[0]?.id || '' })
    setModalOpen(true)
  }

  const startEdit = (p) => {
    setSelected(p)
    setForm({
      name: p.name || '',
      brand: p.brand || 'Belumi',
      description: p.description || '',
      ingredients: p.ingredients || '',
      benefits: p.benefits || '',
      price: p.price || 0,
      thumbnailUrl: p.thumbnailUrl || '',
      imageUrl: p.imageUrl || '',
      suitableSkinTypes: p.suitableSkinTypes || '',
      categoryId: p.categoryId || categories[0]?.id || '',
    })
    setModalOpen(true)
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('Vui lòng điền tên sản phẩm.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        categoryId: form.categoryId,
        isActive: true,
      }
      if (selected) {
        await apiFetch(`/admin/products/${selected.id}`, {
          method: 'PUT',
          token,
          body: { ...selected, ...payload }
        })
        showToast('Đã cập nhật sản phẩm.')
      } else {
        await apiFetch('/admin/products', {
          method: 'POST',
          token,
          body: payload
        })
        showToast('Đã tạo sản phẩm thành công.')
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu sản phẩm.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (p) => {
    if (!window.confirm(`Ẩn sản phẩm "${p.name}"?`)) return
    try {
      await apiFetch(`/admin/products/${p.id}`, {
        method: 'DELETE',
        token
      })
      showToast('Đã ẩn sản phẩm.')
      await loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi ẩn sản phẩm.', 'error')
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Sản phẩm Skincare</h1>
        <button className="primary-btn" onClick={startCreate} type="button">Tạo sản phẩm</button>
      </div>

      <div className="filter-bar">
        <label className="search-box">
          <Search size={18} />
          <input
            placeholder="Tìm theo tên sản phẩm, thương hiệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải sản phẩm...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Thương hiệu</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Thành phần chính</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Chưa có sản phẩm nào.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.thumbnailUrl || p.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=100&q=80'} alt="" className="table-thumb" />
                    </td>
                    <td>{p.brand}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.categoryName || 'Chưa phân loại'}</td>
                    <td>{p.price > 0 ? `${p.price.toLocaleString('vi-VN')} VND` : 'Liên hệ'}</td>
                    <td className="ingredients-cell" title={p.ingredients}>{p.ingredients || 'Chưa cập nhật'}</td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" onClick={() => startEdit(p)} className="edit-btn">
                          <Edit size={14} /> Sửa
                        </button>
                        <button type="button" onClick={() => deleteProduct(p)} className="ban-btn">
                          <Trash2 size={14} /> Ẩn
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
          <form className="login-modal admin-editor-modal product-modal" onSubmit={saveProduct}>
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
            <p className="eyebrow">Product form</p>
            <h2>{selected ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>

            <div className="form-grid-2">
              <div>
                <label htmlFor="prod-name">Tên sản phẩm</label>
                <input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                <label htmlFor="prod-brand">Thương hiệu</label>
                <input
                  id="prod-brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />

                <label htmlFor="prod-price">Giá (VND)</label>
                <input
                  id="prod-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />

                <label htmlFor="prod-category">Danh mục sản phẩm</label>
                <select
                  id="prod-category"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <label htmlFor="prod-skin">Loại da phù hợp (oily, dry, sensitive...)</label>
                <input
                  id="prod-skin"
                  placeholder="Ví dụ: oily, combination"
                  value={form.suitableSkinTypes}
                  onChange={(e) => setForm({ ...form, suitableSkinTypes: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="prod-thumb">Ảnh Thumbnail URL</label>
                <input
                  id="prod-thumb"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                />

                <label htmlFor="prod-image">Ảnh lớn URL</label>
                <input
                  id="prod-image"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />

                <label htmlFor="prod-desc">Mô tả sản phẩm</label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <label htmlFor="prod-benefits">Lợi ích công dụng</label>
                <textarea
                  id="prod-benefits"
                  rows={3}
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                />
              </div>
            </div>

            <label htmlFor="prod-ingredients">Danh sách INCI Ingredients (phân cách bằng dấu phẩy)</label>
            <textarea
              id="prod-ingredients"
              rows={4}
              placeholder="Ví dụ: Aqua, Glycerin, Niacinamide, Hyaluronic Acid..."
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              required
            />

            <div className="admin-editor-actions">
              <button type="button" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="primary-btn" type="submit" disabled={saving}>
                <Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

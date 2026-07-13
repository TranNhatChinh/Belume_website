import React, { useState, useEffect } from 'react'
import { Search, FileText, Trash2, Save } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

const emptyIngredient = {
  nameInc: '',
  name: '',
  category: '',
  description: '',
  links: '',
}

export default function AdminIngredientsTab({ token, showToast }) {
  const [ingredients, setIngredients] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyIngredient)
  const [search, setSearch] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadIngredients = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '50' })
      if (search.trim()) params.set('search', search.trim())
      const data = await apiFetch(`/ingredients?${params.toString()}`)
      setIngredients(data?.items || [])
    } catch (err) {
      setError(err.message || 'Không tải được ingredients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadIngredients, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const resetForm = () => {
    setSelected(null)
    setForm(emptyIngredient)
  }

  const editIngredient = (ingredient) => {
    setSelected(ingredient)
    setForm({
      nameInc: ingredient.nameInc || ingredient.name_inc || '',
      name: ingredient.name || '',
      category: ingredient.category || '',
      description: ingredient.description || '',
      links: ingredient.links || '',
    })
  }

  const saveIngredient = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const path = selected ? `/ingredients/${selected.id}` : '/ingredients'
      await apiFetch(path, {
        method: selected ? 'PUT' : 'POST',
        token,
        body: {
          nameInc: form.nameInc.trim(),
          name: form.name.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          links: form.links.trim(),
        },
      })
      showToast(selected ? 'Đã cập nhật hoạt chất.' : 'Đã tạo hoạt chất mới.')
      resetForm()
      await loadIngredients()
    } catch (err) {
      setError(err.message || 'Không lưu được ingredient.')
    } finally {
      setSaving(false)
    }
  }

  const deleteIngredient = async (ingredient) => {
    if (!window.confirm(`Xóa ingredient "${ingredient.nameInc || ingredient.name}"?`)) return
    try {
      await apiFetch(`/ingredients/${ingredient.id}`, {
        method: 'DELETE',
        token,
      })
      showToast('Đã xóa hoạt chất.')
      await loadIngredients()
    } catch (err) {
      showToast(err.message || 'Không xóa được ingredient.', 'error')
    }
  }

  const importCsv = async (event) => {
    event.preventDefault()
    if (!csvFile) {
      setError('Chọn file CSV trước khi import.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const body = new FormData()
      body.append('file', csvFile)
      const result = await apiFetch('/admin/ingredients/import-csv', {
        method: 'POST',
        token,
        body,
      })
      showToast(`Import thành công: ${result.created} tạo mới, ${result.updated} cập nhật.`)
      setCsvFile(null)
      await loadIngredients()
    } catch (err) {
      setError(err.message || 'Import CSV thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Hoạt chất & Thành phần mỹ phẩm</h1>
      </div>

      <div className="admin-layout admin-ingredient-layout">
        <form className="admin-form" onSubmit={saveIngredient}>
          <div className="admin-form-head">
            <h2>{selected ? 'Sửa Hoạt chất' : 'Tạo Hoạt chất mới'}</h2>
            {selected && (
              <button type="button" onClick={resetForm}>Hủy sửa</button>
            )}
          </div>
          <IngredientInput label="Tên INCI (Tiếng Anh)" name="nameInc" form={form} setForm={setForm} required />
          <IngredientInput label="Tên Tiếng Việt" name="name" form={form} setForm={setForm} required />
          <IngredientInput label="Category" name="category" form={form} setForm={setForm} required />
          
          <label htmlFor="ingredient-description">Description</label>
          <textarea
            id="ingredient-description"
            rows={7}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
          />
          <IngredientInput label="Reference URL (Links)" name="links" form={form} setForm={setForm} required />
          
          {error && <p className="form-error">{error}</p>}
          <button className="primary-btn" disabled={saving} type="submit">
            <Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu hoạt chất'}
          </button>
        </form>

        <div className="admin-list">
          <form className="admin-import" onSubmit={importCsv}>
            <h2>Import CSV hoạt chất</h2>
            <div className="import-row">
              <input
                accept=".csv,text/csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                type="file"
              />
              <button className="primary-btn" disabled={saving || !csvFile} type="submit">Import</button>
            </div>
          </form>

          <div className="admin-list-head">
            <h2>Danh sách ({ingredients.length})</h2>
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Tìm hoạt chất..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <div className="ingredients-admin-list">
              {ingredients.map((ingredient) => (
                <article className="admin-news-item ingredient-admin-item" key={ingredient.id}>
                  <div>
                    <span className="badge plan-free">{ingredient.category}</span>
                    <h3>{ingredient.nameInc}</h3>
                    <strong>{ingredient.name}</strong>
                    <p>{ingredient.description}</p>
                  </div>
                  <div className="admin-actions">
                    <button type="button" onClick={() => editIngredient(ingredient)} className="edit-btn">
                      <FileText size={16} /> Sửa
                    </button>
                    <button type="button" onClick={() => deleteIngredient(ingredient)} className="ban-btn">
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IngredientInput({ label, name, form, setForm, required }) {
  return (
    <>
      <label htmlFor={`ingredient-${name}`}>{label}</label>
      <input
        id={`ingredient-${name}`}
        value={form[name] || ''}
        onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
        required={required}
      />
    </>
  )
}

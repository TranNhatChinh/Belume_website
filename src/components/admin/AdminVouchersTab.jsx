import React, { useState, useEffect } from 'react'
import { Ticket, Plus, Trash2, Ban, Search, Loader2, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

export default function AdminVouchersTab({ token, showToast }) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    expiryDate: '',
    type: 1, // MultiUsePerUser by default
    discountValue: 0,
    discountType: 0, // FixedAmount by default
    usageLimit: '',
  })

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/admin/vouchers', { token })
      setVouchers(data || [])
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải danh sách voucher', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code || !formData.expiryDate || formData.discountValue <= 0) {
      showToast('Vui lòng điền đầy đủ mã, ngày hết hạn và giá trị giảm!', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        code: formData.code.toUpperCase(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        type: Number(formData.type),
        discountValue: Number(formData.discountValue),
        discountType: Number(formData.discountType),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      }

      await apiFetch('/admin/vouchers', {
        method: 'POST',
        body: payload,
        token,
      })

      showToast('Tạo voucher thành công!')
      setShowModal(false)
      setFormData({
        code: '',
        expiryDate: '',
        type: 1,
        discountValue: 0,
        discountType: 0,
        usageLimit: '',
      })
      fetchVouchers()
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo voucher', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deactivateVoucher = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa voucher này?')) return

    try {
      await apiFetch(`/admin/vouchers/${id}/deactivate`, {
        method: 'POST',
        token,
      })
      showToast('Đã vô hiệu hóa voucher')
      fetchVouchers()
    } catch (err) {
      showToast(err.message || 'Lỗi khi vô hiệu hóa', 'error')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const filteredVouchers = vouchers.filter((v) =>
    v.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="admin-loading-state">
        <Loader2 className="spinner" size={32} />
        <p>Đang tải danh sách voucher...</p>
      </div>
    )
  }

  return (
    <div className="admin-content-card fade-in">
      <div className="admin-content-header">
        <div className="header-title">
          <Ticket className="header-icon" />
          <h2>Quản lý Voucher</h2>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Tạo Voucher</span>
        </button>
      </div>

      <div className="admin-content-body">
        <div className="admin-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm voucher theo mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Giá trị giảm</th>
                <th>Loại Voucher</th>
                <th>Hạn sử dụng</th>
                <th>Giới hạn / Đã dùng</th>
                <th>Trạng thái</th>
                <th className="action-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center empty-state">
                    Không tìm thấy voucher nào.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="fw-600 text-primary">{v.code}</td>
                    <td>
                      {v.discountType === 0
                        ? formatCurrency(v.discountValue)
                        : `${v.discountValue}%`}
                    </td>
                    <td>
                      {v.type === 0 ? (
                        <span className="badge badge-warning">1 lần / Toàn hệ thống</span>
                      ) : (
                        <span className="badge badge-info">1 lần / 1 Tài khoản</span>
                      )}
                    </td>
                    <td>
                      {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                      <br />
                      <small className="text-muted">
                        {new Date(v.expiryDate).toLocaleTimeString('vi-VN')}
                      </small>
                    </td>
                    <td>
                      {v.usageLimit ? `${v.usageLimit}` : 'Không giới hạn'}
                      {' / '}
                      <strong className="text-primary">{v.usages || 0}</strong>
                    </td>
                    <td>
                      {v.isActive ? (
                        new Date(v.expiryDate) < new Date() ? (
                          <span className="badge badge-error">Đã hết hạn</span>
                        ) : (
                          <span className="badge badge-success">Đang hoạt động</span>
                        )
                      ) : (
                        <span className="badge badge-neutral">Đã vô hiệu hóa</span>
                      )}
                    </td>
                    <td className="action-col">
                      {v.isActive && (
                        <button
                          className="icon-btn tooltip-trigger"
                          title="Vô hiệu hóa"
                          onClick={() => deactivateVoucher(v.id)}
                        >
                          <Ban size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <h3>Tạo Voucher mới</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <form id="voucher-form" onSubmit={handleSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Mã Voucher *</label>
                    <input
                      type="text"
                      name="code"
                      placeholder="VD: KHAI_TRUONG_50"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Ngày hết hạn *</label>
                    <input
                      type="datetime-local"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Loại giảm giá</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                    >
                      <option value={0}>Giảm theo số tiền (VND)</option>
                      <option value={1}>Giảm theo %</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Giá trị giảm *</label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Phạm vi sử dụng</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value={1}>1 lần / 1 Tài khoản (MultiUsePerUser)</option>
                      <option value={0}>1 lần / Toàn hệ thống (SingleUse)</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Tổng lượt dùng tối đa (Trống = KGH)</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      placeholder="VD: 100"
                      min="1"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="admin-modal-footer">
              <button className="outline-btn" onClick={() => setShowModal(false)} type="button">
                Hủy
              </button>
              <button
                className="primary-btn"
                type="submit"
                form="voucher-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="spinner" size={18} /> : <CheckCircle2 size={18} />}
                <span>Lưu Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

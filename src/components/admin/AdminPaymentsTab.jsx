import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

export default function AdminPaymentsTab({ token, showToast }) {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/admin/payments', { token })
      setPayments(data || [])
    } catch (err) {
      showToast(err.message || 'Lỗi tải lịch sử giao dịch.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [token])

  const filteredPayments = payments.filter((p) => {
    const textMatch = p.userEmail?.toLowerCase().includes(search.toLowerCase()) || 
                      p.userFullName?.toLowerCase().includes(search.toLowerCase()) || 
                      p.transactionCode?.toLowerCase().includes(search.toLowerCase()) || false
    const isPaid = p.paymentStatus === 'Paid' || p.paymentStatus === 'MockPaid'
    const statusMatch = statusFilter === 'all' || 
                        (statusFilter === 'paid' && isPaid) ||
                        (statusFilter === 'pending' && p.paymentStatus === 'Pending')
    return textMatch && statusMatch
  })

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Giao dịch</h1>
        <button className="secondary-btn" onClick={loadPayments} type="button">Làm mới</button>
      </div>

      <div className="filter-bar">
        <label className="search-box">
          <Search size={18} />
          <input
            placeholder="Tìm theo email, mã GD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="paid">Thành công (Paid)</option>
          <option value="pending">Chờ xử lý (Pending)</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải lịch sử thanh toán...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Thành viên</th>
                <th>Email</th>
                <th>Gói</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Không có giao dịch nào phù hợp.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPaid = p.paymentStatus === 'Paid' || p.paymentStatus === 'MockPaid'
                  return (
                    <tr key={p.id}>
                      <td><code>{p.transactionCode}</code></td>
                      <td><strong>{p.userFullName || 'Ẩn danh'}</strong></td>
                      <td>{p.userEmail}</td>
                      <td>{p.planName}</td>
                      <td><strong>{p.amount.toLocaleString('vi-VN')} {p.currency}</strong></td>
                      <td>{p.paymentMethod}</td>
                      <td>
                        <span className={`badge status-${isPaid ? 'active' : 'pending'}`}>
                          {isPaid ? 'Thành công' : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

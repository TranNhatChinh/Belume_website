import React, { useState, useEffect } from 'react'
import { Search, Power } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

export default function AdminUsersTab({ token, showToast }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/admin/users', { token })
      setUsers(data || [])
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách user.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [token])

  const toggleUserStatus = async (user) => {
    setUpdatingId(user.id)
    try {
      await apiFetch(`/admin/users/${user.id}/status`, {
        method: 'PUT',
        token,
        body: { isActive: !user.isActive }
      })
      showToast(`Đã ${!user.isActive ? 'mở khóa' : 'khóa'} tài khoản thành công.`)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
      )
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const nameMatch = u.fullName?.toLowerCase().includes(search.toLowerCase()) || false
    const emailMatch = u.email?.toLowerCase().includes(search.toLowerCase()) || false
    const planMatch = filterPlan === 'all' || u.subscriptionPlan?.toLowerCase() === filterPlan.toLowerCase()
    return (nameMatch || emailMatch) && planMatch
  })

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Thành viên</h1>
        <button className="secondary-btn" onClick={loadUsers} disabled={loading} type="button">Làm mới</button>
      </div>

      <div className="filter-bar">
        <label className="search-box">
          <Search size={18} />
          <input
            placeholder="Tìm theo email, họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
          <option value="all">Tất cả gói</option>
          <option value="Free">Gói Free</option>
          <option value="Monthly">Gói Monthly</option>
          <option value="Yearly">Gói Yearly</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải thành viên...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Quyền</th>
                <th>Gói dịch vụ</th>
                <th>Trạng thái</th>
                <th>Ngày gia nhập</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Không có thành viên nào.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName || 'Ẩn danh'}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge role-${u.role === 1 ? 'admin' : 'customer'}`}>
                        {u.role === 1 ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge plan-${u.subscriptionPlan?.toLowerCase() || 'free'}`}>
                        {u.subscriptionPlan || 'Free'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${u.isActive ? 'active' : 'banned'}`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <button
                        type="button"
                        className={`action-btn ${u.isActive ? 'ban-btn' : 'unban-btn'}`}
                        onClick={() => toggleUserStatus(u)}
                        disabled={updatingId === u.id || u.role === 1}
                        title={u.role === 1 ? 'Không thể khóa tài khoản Admin' : ''}
                      >
                        <Power size={14} />
                        {updatingId === u.id ? '...' : u.isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

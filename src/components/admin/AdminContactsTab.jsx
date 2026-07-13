import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../belumiApi'

export default function AdminContactsTab({ token, showToast }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const loadContacts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/admin/contacts', { token })
      setContacts(data || [])
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách liên hệ.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [token])

  const updateStatus = async (id, statusVal) => {
    setUpdatingId(id)
    try {
      await apiFetch(`/admin/contacts/${id}/status`, {
        method: 'PATCH',
        token,
        body: statusVal
      })
      showToast('Đã cập nhật trạng thái liên hệ.')
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: statusVal } : c))
      )
    } catch (err) {
      showToast(err.message || 'Cập nhật thất bại.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 0: return <span className="badge status-banned">Mới</span>
      case 1: return <span className="badge status-pending">Đang xử lý</span>
      case 2: return <span className="badge status-active">Đã xử lý</span>
      default: return <span className="badge">Chưa rõ</span>
    }
  }

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h1>Quản lý Yêu cầu Liên hệ & Góp ý</h1>
        <button className="secondary-btn" onClick={loadContacts} type="button">Làm mới</button>
      </div>

      {loading ? (
        <div className="admin-tab-loading">Đang tải danh sách liên hệ...</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Nội dung tin nhắn</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Không có yêu cầu liên hệ nào.</td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.fullName}</strong></td>
                    <td><code>{c.phone}</code></td>
                    <td>{c.email || 'N/A'}</td>
                    <td>
                      <div className="message-content-box" title={c.message}>{c.message}</div>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>{new Date(c.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <div className="admin-actions vertical-actions">
                        <button
                          type="button"
                          className="action-btn"
                          disabled={updatingId === c.id || c.status === 1}
                          onClick={() => updateStatus(c.id, 1)}
                        >
                          Xử lý
                        </button>
                        <button
                          type="button"
                          className="action-btn resolve-btn"
                          disabled={updatingId === c.id || c.status === 2}
                          onClick={() => updateStatus(c.id, 2)}
                        >
                          Xong
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
    </div>
  )
}

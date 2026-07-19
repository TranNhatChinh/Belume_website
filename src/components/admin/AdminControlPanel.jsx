import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingBag,
  FolderOpen,
  FlaskConical,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Ticket,
} from 'lucide-react'
import { SiteNav } from '../../App'
import AdminDashboardTab from './AdminDashboardTab'
import AdminUsersTab from './AdminUsersTab'
import AdminPaymentsTab from './AdminPaymentsTab'
import AdminProductsTab from './AdminProductsTab'
import AdminNewsTab from './AdminNewsTab'
import AdminNewsCategoriesTab from './AdminNewsCategoriesTab'
import AdminIngredientsTab from './AdminIngredientsTab'
import AdminContactsTab from './AdminContactsTab'
import AdminVouchersTab from './AdminVouchersTab'

export default function AdminControlPanel(props) {
  const { activeTab, setActiveTab, authState, isAdmin, openLogin, logout } = props
  const [toast, setToast] = useState(null)

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (!authState.loading && !authState.appUser) {
    return (
      <main>
        <SiteNav {...props} active="admin" />
        <section className="admin-page admin-empty">
          <h1>Đăng nhập để vào trang quản trị</h1>
          <button className="primary-btn" type="button" onClick={openLogin}>
            Đăng nhập
          </button>
        </section>
      </main>
    )
  }

  if (!authState.loading && !isAdmin) {
    return (
      <main>
        <SiteNav {...props} active="admin" />
        <section className="admin-page admin-empty">
          <h1>Bạn không có quyền truy cập trang quản trị</h1>
          <p>Tài khoản hiện tại không có role Admin.</p>
        </section>
      </main>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardTab token={authState.token} showToast={showToast} />
      case 'users':
        return <AdminUsersTab token={authState.token} showToast={showToast} />
      case 'payments':
        return <AdminPaymentsTab token={authState.token} showToast={showToast} />
      case 'products':
        return <AdminProductsTab token={authState.token} showToast={showToast} />
      case 'news':
        return <AdminNewsTab token={authState.token} showToast={showToast} />
      case 'categories':
        return <AdminNewsCategoriesTab token={authState.token} showToast={showToast} />
      case 'ingredients':
        return <AdminIngredientsTab token={authState.token} showToast={showToast} />
      case 'contacts':
        return <AdminContactsTab token={authState.token} showToast={showToast} />
      case 'vouchers':
        return <AdminVouchersTab token={authState.token} showToast={showToast} />
      default:
        return <AdminDashboardTab token={authState.token} showToast={showToast} />
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Thành viên', icon: Users },
    { id: 'payments', label: 'Giao dịch', icon: CreditCard },
    { id: 'products', label: 'Sản phẩm', icon: ShoppingBag },
    { id: 'news', label: 'Bài viết', icon: BookOpen },
    { id: 'categories', label: 'Danh mục blog', icon: FolderOpen },
    { id: 'ingredients', label: 'Hoạt chất', icon: FlaskConical },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'contacts', label: 'Yêu cầu liên hệ', icon: Mail },
  ]

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    window.history.pushState(null, '', tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`)
  }

  return (
    <main className="admin-layout-container">
      <SiteNav {...props} active="admin" />
      
      <div className="admin-workspace">
        <aside className="admin-sidebar" aria-label="Menu quản trị">
          <div className="sidebar-brand">
            <Sparkles size={20} className="glow-icon" />
            <span>Belumi Admin</span>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  className={`sidebar-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleTabChange(item.id)}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-sidebar-btn" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </aside>

        <section className="admin-tab-viewport">
          {renderTabContent()}
        </section>
      </div>

      {toast && (
        <div className={`toast-notification ${toast.type}`} role="alert">
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}
    </main>
  )
}

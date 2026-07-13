import React, { useState, useEffect } from 'react'
import { TrendingUp, CreditCard, Sparkles, Users } from 'lucide-react'
import { apiFetch } from '../../belumiApi'

export default function AdminDashboardTab({ token, showToast }) {
  const [period, setPeriod] = useState('daily')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await apiFetch(`/admin/dashboard/analytics?period=${period}`, { token })
        setData(res)
      } catch (err) {
        showToast(err.message || 'Lỗi tải dữ liệu phân tích.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [period, token])

  if (loading) {
    return <div className="admin-tab-loading">Đang tải dữ liệu dashboard...</div>
  }

  if (!data) {
    return <div className="admin-tab-error">Không có dữ liệu phân tích.</div>
  }

  const { overview, timeSeries, distributions, recentActivities } = data

  // Chuẩn bị dữ liệu vẽ SVG Chart
  const svgW = 500
  const svgH = 200
  const pad = 20

  const revs = timeSeries.map((p) => p.revenue || 0)
  const maxRev = Math.max(...revs, 100000)
  
  const scans = timeSeries.map((p) => p.scans || 0)
  const maxScans = Math.max(...scans, 5)

  const usersList = timeSeries.map((p) => p.newUsers || 0)
  const maxUsers = Math.max(...usersList, 5)

  // Vẽ các điểm
  const makePoints = (vals, maxVal) => {
    if (timeSeries.length < 2) return ''
    return timeSeries.map((p, i) => {
      const x = pad + (i / (timeSeries.length - 1)) * (svgW - pad * 2)
      const y = svgH - pad - (vals[i] / maxVal) * (svgH - pad * 2)
      return `${x},${y}`
    }).join(' ')
  }

  const revPoints = makePoints(revs, maxRev)
  const scanPoints = makePoints(scans, maxScans)
  const userPoints = makePoints(usersList, maxUsers)

  return (
    <div className="dashboard-tab">
      <div className="tab-header">
        <h1>Dashboard Tổng quan</h1>
        <div className="period-selector">
          <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>30 ngày</button>
          <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>12 tháng</button>
          <button className={period === 'yearly' ? 'active' : ''} onClick={() => setPeriod('yearly')}>5 năm</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-meta">
            <span>Doanh thu ({period === 'daily' ? '30n' : period === 'monthly' ? '12th' : '5n'})</span>
            <div className={`kpi-growth ${overview.revenueGrowthPercent >= 0 ? 'up' : 'down'}`}>
              {overview.revenueGrowthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{transform: 'rotate(180deg)'}} />}
              <span>{Math.abs(overview.revenueGrowthPercent)}%</span>
            </div>
          </div>
          <h3>{overview.totalRevenue.toLocaleString('vi-VN')} VND</h3>
          <small>{overview.premiumPurchases} giao dịch thành công</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-meta">
            <span>Thành viên mới</span>
            <div className={`kpi-growth ${overview.userGrowthPercent >= 0 ? 'up' : 'down'}`}>
              {overview.userGrowthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{transform: 'rotate(180deg)'}} />}
              <span>{Math.abs(overview.userGrowthPercent)}%</span>
            </div>
          </div>
          <h3>{overview.newUsers} thành viên</h3>
          <small>Tổng số: {overview.totalUsers} (Premium: {overview.premiumUsersCount})</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-meta">
            <span>Lượt phân tích & Tra cứu</span>
            <div className={`kpi-growth ${overview.scanGrowthPercent >= 0 ? 'up' : 'down'}`}>
              {overview.scanGrowthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{transform: 'rotate(180deg)'}} />}
              <span>{Math.abs(overview.scanGrowthPercent)}%</span>
            </div>
          </div>
          <h3>{overview.totalScans} lượt</h3>
          <small>AI skin scan + Tra cứu INCI</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-meta">
            <span>Tỉ lệ chuyển đổi Premium</span>
          </div>
          <h3>{overview.conversionRate}%</h3>
          <small>Tỉ lệ Premium / Tổng User</small>
        </div>
      </div>

      <div className="dashboard-charts-layout">
        <div className="chart-card">
          <h2>Xuuyên hướng hoạt động & Doanh thu</h2>
          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="svg-chart">
              {/* Grid Lines */}
              <line x1={pad} y1={pad} x2={svgW - pad} y2={pad} stroke="var(--line)" strokeDasharray="4 4" />
              <line x1={pad} y1={svgH / 2} x2={svgW - pad} y2={svgH / 2} stroke="var(--line)" strokeDasharray="4 4" />
              <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="var(--line)" />

              {/* Path Revenue (Caramel) */}
              {revPoints && <polyline points={revPoints} fill="none" stroke="var(--caramel)" strokeWidth="3" strokeLinecap="round" />}
              {/* Path Scans (Ink) */}
              {scanPoints && <polyline points={scanPoints} fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />}
              {/* Path Users (Rose) */}
              {userPoints && <polyline points={userPoints} fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" />}
            </svg>
            <div className="chart-legend">
              <span className="legend-item"><i className="color-dot caramel"></i> Doanh thu</span>
              <span className="legend-item"><i className="color-dot ink dashed"></i> Lượt quét AI</span>
              <span className="legend-item"><i className="color-dot rose"></i> Đăng ký mới</span>
            </div>
          </div>
        </div>

        <div className="distributions-card">
          <h2>Phân bố & Sở thích</h2>
          <div className="dist-section">
            <h3>Gói đăng ký</h3>
            <div className="ring-charts">
              {distributions.subscriptionPlans.map((p) => (
                <SvgPieRing key={p.name} percentage={p.percentage} color="var(--caramel)" label={p.name} count={p.count} />
              ))}
            </div>
          </div>
          <div className="dist-section">
            <h3>Top Hoạt chất tra cứu</h3>
            <div className="bar-ranks">
              {distributions.topIngredients.map((ing, idx) => (
                <div className="rank-item" key={ing.name}>
                  <span className="rank-num">{idx + 1}</span>
                  <div className="rank-progress-container">
                    <div className="rank-meta">
                      <strong>{ing.name}</strong>
                      <span>{ing.count} lượt</span>
                    </div>
                    <div className="rank-bar" style={{ '--w': `${Math.min(100, (ing.count / (distributions.topIngredients[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="recent-activity-section">
        <h2>Nhật ký hoạt động hệ thống</h2>
        <div className="activity-timeline">
          {recentActivities.map((act, index) => {
            const isPayment = act.type === 'payment'
            const isScan = act.type === 'scan'
            const Icon = isPayment ? CreditCard : isScan ? Sparkles : Users
            return (
              <article className="activity-item" key={index}>
                <div className={`activity-icon-wrap ${act.type}`}>
                  <Icon size={16} />
                </div>
                <div className="activity-info">
                  <strong>{act.title}</strong>
                  <span>{act.subtitle}</span>
                  <small>{new Date(act.timestamp).toLocaleString('vi-VN')}</small>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SvgPieRing({ percentage, color, label, count }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  return (
    <div className="pie-ring-item">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
        <text cx="30" cy="30" x="30" y="34" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--ink)">
          {Math.round(percentage)}%
        </text>
      </svg>
      <div className="ring-meta">
        <strong>{label}</strong>
        <span>{count} user</span>
      </div>
    </div>
  )
}

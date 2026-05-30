import {
  ArrowRight,
  BookOpenText,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  LockKeyhole,
  Palette,
  Save,
  ScanText,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import logoImg from './assets/belumi_logo_cropped.png'
import {
  apiFetch,
  loginWithFirebase,
  logoutFirebase,
  observeAuth,
  syncCurrentFirebaseUser,
} from './belumiApi'
import './App.css'

const appLink = '#download-app'

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

const features = [
  {
    icon: Camera,
    title: 'Skin AI',
    text: 'Phân tích ảnh da, điểm tổng quan và quy trình chăm sóc cá nhân hóa.',
    status: 'Dùng trong ứng dụng',
  },
  {
    icon: ScanText,
    title: 'Ingredient Lookup',
    text: 'Tra cứu INCI, dán bảng thành phần hoặc quét nhãn sản phẩm.',
    status: 'Dùng trong ứng dụng',
  },
  {
    icon: Palette,
    title: 'Virtual Makeup',
    text: 'Thử gợi ý makeup theo tone da, dịp sử dụng và sản phẩm.',
    status: 'Dùng trong ứng dụng',
  },
  {
    icon: Heart,
    title: 'Wishlist & Routine',
    text: 'Lưu sản phẩm, quy trình chăm sóc và bài viết yêu thích trong tài khoản.',
    status: 'Cần đăng nhập app',
  },
]

const appCards = [
  'Upload ảnh mặt để AI đọc dấu hiệu da',
  'Quét nhãn mỹ phẩm bằng camera',
  'Lưu wishlist và quy trình chăm sóc vào tài khoản',
]

const aboutSections = [
  {
    title: 'Cách chúng tôi xây dựng nội dung',
    body: [
      'Các nội dung trên website được tổng hợp, chọn lọc và trình bày theo hướng dễ hiểu cho người dùng phổ thông. Chúng tôi cố gắng diễn giải các khái niệm chăm sóc da một cách rõ ràng, tránh dùng quá nhiều thuật ngữ khó hiểu.',
      'Mỗi làn da là khác nhau. Một sản phẩm, thành phần hoặc quy trình phù hợp với người này chưa chắc sẽ phù hợp với người khác, vì vậy nội dung trên website nên được xem là nguồn tham khảo.',
    ],
  },
  {
    title: 'Vai trò của website',
    body: [
      'Website này không phải là cơ sở khám chữa bệnh và không cung cấp dịch vụ chẩn đoán, điều trị hoặc tư vấn y khoa cá nhân.',
      'Với các tình trạng như mụn viêm nặng, kích ứng kéo dài, dị ứng, viêm da hoặc tổn thương da, người dùng nên tham khảo ý kiến bác sĩ da liễu trước khi áp dụng sản phẩm hoặc quy trình chăm sóc da.',
    ],
  },
  {
    title: 'Lưu ý khi sử dụng thông tin',
    body: [
      'Thông tin trên website được cung cấp nhằm hỗ trợ người dùng tìm hiểu thêm về chăm sóc da và có thêm cơ sở trước khi đưa ra quyết định.',
      'Người dùng nên đọc kỹ thông tin sản phẩm, kiểm tra thành phần, thử sản phẩm thận trọng và ngưng sử dụng nếu xuất hiện dấu hiệu kích ứng bất thường.',
    ],
  },
  {
    title: 'Sứ mệnh của chúng tôi',
    body: [
      'Chúng tôi muốn biến chăm sóc da từ một mê cung thông tin thành một hành trình dễ hiểu hơn.',
      'Không cần chạy theo mọi xu hướng. Điều quan trọng là hiểu làn da của mình cần gì, biết cách đọc thông tin và đưa ra lựa chọn phù hợp hơn mỗi ngày.',
    ],
  },
]

function App() {
  const [page, setPage] = useState(() => {
    if (window.location.pathname === '/about') return 'about'
    if (window.location.pathname === '/admin/news') return 'admin-news'
    return 'home'
  })
  const [authState, setAuthState] = useState({
    firebaseUser: null,
    appUser: null,
    token: '',
    loading: true,
  })
  const [loginOpen, setLoginOpen] = useState(false)
  const [publicNews, setPublicNews] = useState([])
  const [newsState, setNewsState] = useState({ loading: true, error: '' })

  const isAdmin = authState.appUser?.role?.toString().toLowerCase() === 'admin'

  useEffect(() => {
    const unsubscribe = observeAuth(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState({ firebaseUser: null, appUser: null, token: '', loading: false })
        return
      }

      try {
        const token = await firebaseUser.getIdToken(true)
        const appUser = await syncCurrentFirebaseUser(firebaseUser)
        setAuthState({ firebaseUser, appUser, token, loading: false })
      } catch {
        setAuthState({ firebaseUser, appUser: null, token: '', loading: false })
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/about') setPage('about')
      else if (window.location.pathname === '/admin/news') setPage('admin-news')
      else setPage('home')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadPublicNews() {
      setNewsState({ loading: true, error: '' })
      try {
        const data = await apiFetch('/news?sort=newest')
        if (!ignore) {
          setPublicNews(data || [])
          setNewsState({ loading: false, error: '' })
        }
      } catch (err) {
        if (!ignore) {
          setNewsState({
            loading: false,
            error: err.message || 'Không tải được blogs/news.',
          })
        }
      }
    }
    loadPublicNews()
    return () => {
      ignore = true
    }
  }, [])

  const navigate = (nextPage, path, hash = '') => {
    window.history.pushState(null, '', `${path}${hash}`)
    setPage(nextPage)
    requestAnimationFrame(() => {
      if (hash) document.querySelector(hash)?.scrollIntoView()
      else window.scrollTo({ top: 0 })
    })
  }

  const goHome = (hash = '') => navigate('home', '/', hash)
  const goAbout = () => navigate('about', '/about')
  const goAdminNews = () => navigate('admin-news', '/admin/news')

  const logout = async () => {
    await logoutFirebase()
    if (page === 'admin-news') goHome()
  }

  if (page === 'about') {
    return (
      <>
        <AboutPage
          active="about"
          authState={authState}
          goAbout={goAbout}
          goAdminNews={goAdminNews}
          goHome={goHome}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  if (page === 'admin-news') {
    return (
      <>
        <AdminNewsPage
          authState={authState}
          goAbout={goAbout}
          goAdminNews={goAdminNews}
          goHome={goHome}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  return (
    <main>
      <SiteNav
        authState={authState}
        goAbout={goAbout}
        goAdminNews={goAdminNews}
        goHome={goHome}
        isAdmin={isAdmin}
        logout={logout}
        openLogin={() => setLoginOpen(true)}
      />

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <p className="eyebrow">BeautyCenter AI</p>
          <h1>Chuyên gia làm đẹp AI của riêng bạn</h1>
          <div className="hero-actions">
            <a className="primary-btn" href={appLink}>
              Truy cập ứng dụng <ArrowRight size={18} />
            </a>
            <a className="ghost-btn" href="#news">
              Đọc blogs/news <BookOpenText size={18} />
            </a>
          </div>
        </div>

        <div className="hero-card" aria-label="Belumi app preview">
          <div className="hero-glass">
            <Sparkles size={18} />
            AI Score 94%
          </div>
          <strong>Skin profile</strong>
          <span>Hydration balance</span>
          <div className="score-bar">
            <i />
          </div>
          <small>Quy trình buổi sáng đã sẵn sàng trong app</small>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <p className="eyebrow">Feature gateway</p>
          <h2>Tính năng chuyên sâu sẽ mở trong ứng dụng</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <a className="feature-card" href={appLink} key={feature.title}>
              <span className="icon-wrap">
                <feature.icon size={22} />
              </span>
              <span className="feature-status">{feature.status}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <span className="card-link">
                Mở bằng app <ArrowRight size={16} />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="section news-section" id="news">
        <div className="section-head">
          <p className="eyebrow">Blogs / News</p>
          <h2>Nội dung làm đẹp có thể đọc trực tiếp trên web</h2>
        </div>
        {newsState.loading && <p className="section-note">Đang tải blogs/news...</p>}
        {newsState.error && <p className="form-error">{newsState.error}</p>}
        {!newsState.loading && !newsState.error && publicNews.length === 0 && (
          <p className="section-note">Chưa có bài viết được xuất bản.</p>
        )}
        {publicNews.length > 0 && (
          <div className="news-grid">
            {publicNews.slice(0, 6).map((post) => (
              <article className="news-card" key={post.id || post.slug}>
                <img
                  src={
                    post.coverImageUrl ||
                    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80'
                  }
                  alt=""
                />
                <div>
                  <span>{post.category || 'Chăm sóc da'}</span>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <button type="button">Đọc bài viết</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="download-panel" id="download-app">
        <div>
          <p className="eyebrow">Belumi app</p>
          <h2>Muốn phân tích, quét ảnh hoặc lưu quy trình?</h2>
          <p>
            Các thao tác cần camera, ảnh cá nhân, tài khoản và kết quả AI nên
            được đưa về app để bảo mật và giữ đúng trải nghiệm Flutter.
          </p>
        </div>
        <div className="app-box">
          <div className="phone-card">
            <LockKeyhole size={20} />
            <strong>Secure app flow</strong>
            {appCards.map((item) => (
              <span key={item}>
                <CheckCircle2 size={15} /> {item}
              </span>
            ))}
          </div>
          <a className="primary-btn" href="#home">
            <Download size={18} /> Tải/Mở ứng dụng
          </a>
        </div>
      </section>

      <footer>
        <span>Belumi BeautyCenter</span>
        <span>AI và tư vấn làm đẹp cá nhân hóa.</span>
      </footer>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </main>
  )
}

function SiteNav({
  active,
  authState,
  goHome,
  goAbout,
  goAdminNews,
  isAdmin,
  logout,
  openLogin,
}) {
  return (
    <header className="nav" aria-label="Belumi navigation">
      <button
        className="brand"
        type="button"
        onClick={() => goHome('')}
        aria-label="Về trang chủ"
      >
        <img src={logoImg} alt="" />
      </button>
      <nav>
        <button type="button" onClick={() => goHome('#features')}>
          Tính năng
        </button>
        <button type="button" onClick={() => goHome('#news')}>
          Blogs/News
        </button>
        <button
          type="button"
          className={active === 'about' ? 'is-active' : undefined}
          onClick={goAbout}
        >
          About us
        </button>
        {isAdmin && (
          <button
            type="button"
            className={active === 'admin-news' ? 'is-active' : undefined}
            onClick={goAdminNews}
          >
            Trang quản trị
          </button>
        )}
        {authState.appUser ? (
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        ) : (
          <button type="button" onClick={openLogin}>
            Đăng nhập
          </button>
        )}
      </nav>
    </header>
  )
}

function LoginModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithFirebase(email, password)
      onClose()
    } catch (err) {
      setError(err.message || 'Không đăng nhập được.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="login-modal" onSubmit={submit}>
        <button className="modal-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">Belumi account</p>
        <h2>Đăng nhập</h2>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <label htmlFor="login-password">Mật khẩu</label>
        <input
          id="login-password"
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {error && <p className="form-error">{error}</p>}
        <button className="primary-btn" disabled={loading} type="submit">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}

function AboutPage(props) {
  return (
    <main>
      <SiteNav {...props} />
      <article className="about-page">
        <section className="about-hero">
          <p className="eyebrow">Về chúng tôi</p>
          <h1>Chăm sóc da không nên là một việc quá phức tạp.</h1>
          <p>
            Rất nhiều người bắt đầu chăm sóc da trong trạng thái bối rối: không
            biết da mình thuộc loại nào, nên dùng sản phẩm nào trước, thành
            phần nào phù hợp, hay vì sao dùng nhiều sản phẩm nhưng da vẫn không
            cải thiện.
          </p>
          <p>
            Website này được tạo ra để giúp người dùng tiếp cận kiến thức chăm
            sóc da một cách dễ hiểu, có hệ thống và thực tế hơn.
          </p>
        </section>

        <section className="about-focus">
          <h2>Chúng tôi tập trung cung cấp nội dung tham khảo về</h2>
          <ul>
            <li>Cách nhận biết nhu cầu cơ bản của làn da</li>
            <li>Kiến thức về thành phần mỹ phẩm thường gặp</li>
            <li>Gợi ý xây dựng quy trình chăm sóc da đơn giản</li>
            <li>Những lưu ý khi lựa chọn và sử dụng sản phẩm chăm sóc da</li>
            <li>Cách đọc hiểu thông tin sản phẩm một cách tỉnh táo hơn</li>
          </ul>
        </section>

        {aboutSections.map((section) => (
          <section className="about-block" key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  )
}

function AdminNewsPage(props) {
  const { authState, isAdmin, openLogin } = props
  const [news, setNews] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyNews)
  const [status, setStatus] = useState('all')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    return params.toString() ? `?${params.toString()}` : ''
  }, [status])

  const loadNews = async () => {
    if (!authState.token || !isAdmin) return
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/admin/news${query}`, { token: authState.token })
      setNews(data || [])
    } catch (err) {
      setError(err.message || 'Không tải được tin tức.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token, isAdmin, query])

  const editPost = (post) => {
    setSelected(post)
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      summary: post.summary || '',
      content: post.content || '',
      coverImageUrl: post.coverImageUrl || '',
      category: post.category || 'Skincare',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
      author: post.author || 'Belumi Team',
      status: post.status || 'Published',
      publishedAt: post.publishedAt || '',
    })
  }

  const resetForm = () => {
    setSelected(null)
    setForm(emptyNews)
  }

  const savePost = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const payload = {
      ...form,
      tags: form.tags,
      publishedAt: form.publishedAt || new Date().toISOString(),
      isActive: form.status !== 'Hidden',
    }

    try {
      if (selected) {
        await apiFetch(`/admin/news/${selected.id}`, {
          method: 'PUT',
          body: { ...selected, ...payload },
          token: authState.token,
        })
        setMessage('Đã cập nhật bài viết.')
      } else {
        await apiFetch('/admin/news', {
          method: 'POST',
          body: payload,
          token: authState.token,
        })
        setMessage('Đã tạo bài viết.')
      }
      resetForm()
      await loadNews()
    } catch (err) {
      setError(err.message || 'Không lưu được bài viết.')
    }
  }

  const deletePost = async (post) => {
    if (!window.confirm(`Ẩn bài viết "${post.title}"?`)) return
    setMessage('')
    setError('')
    try {
      await apiFetch(`/admin/news/${post.id}`, {
        method: 'DELETE',
        token: authState.token,
      })
      setMessage('Đã ẩn bài viết.')
      await loadNews()
    } catch (err) {
      setError(err.message || 'Không xóa được bài viết.')
    }
  }

  if (!authState.loading && !authState.appUser) {
    return (
      <main>
        <SiteNav {...props} active="admin-news" />
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
        <SiteNav {...props} active="admin-news" />
        <section className="admin-page admin-empty">
          <h1>Bạn không có quyền truy cập trang quản trị</h1>
          <p>Tài khoản hiện tại không có role Admin.</p>
        </section>
      </main>
    )
  }

  return (
    <main>
      <SiteNav {...props} active="admin-news" />
      <section className="admin-page">
        <div className="admin-header">
          <p className="eyebrow">Trang quản trị</p>
          <h1>Quản lý news</h1>
          <p>Phần này gọi trực tiếp các API admin news hiện có trong backend.</p>
        </div>

        <div className="admin-layout">
          <form className="admin-form" onSubmit={savePost}>
            <div className="admin-form-head">
              <h2>{selected ? 'Sửa bài viết' : 'Tạo bài viết'}</h2>
              {selected && (
                <button type="button" onClick={resetForm}>
                  Hủy sửa
                </button>
              )}
            </div>
            <AdminInput label="Tiêu đề" name="title" form={form} setForm={setForm} required />
            <AdminInput label="Slug" name="slug" form={form} setForm={setForm} />
            <AdminInput label="Tóm tắt" name="summary" form={form} setForm={setForm} required />
            <AdminInput label="Ảnh bìa URL" name="coverImageUrl" form={form} setForm={setForm} />
            <AdminInput label="Danh mục" name="category" form={form} setForm={setForm} required />
            <AdminInput label="Tags" name="tags" form={form} setForm={setForm} />
            <label htmlFor="news-status">Trạng thái</label>
            <select
              id="news-status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Hidden">Hidden</option>
            </select>
            <label htmlFor="news-content">Nội dung</label>
            <textarea
              id="news-content"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              required
              rows={8}
            />
            <button className="primary-btn" type="submit">
              <Save size={17} /> Lưu bài viết
            </button>
          </form>

          <div className="admin-list">
            <div className="admin-list-head">
              <h2>Danh sách bài viết</h2>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Tất cả</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
            {loading && <p>Đang tải...</p>}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            {!loading && news.length === 0 && <p>Chưa có bài viết phù hợp.</p>}
            {news.map((post) => (
              <article className="admin-news-item" key={post.id}>
                <div>
                  <span>{post.status}</span>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => editPost(post)}>
                    <FileText size={16} /> Sửa
                  </button>
                  <button type="button" onClick={() => deletePost(post)}>
                    <Trash2 size={16} /> Ẩn
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function AdminInput({ label, name, form, setForm, required }) {
  return (
    <>
      <label htmlFor={`news-${name}`}>{label}</label>
      <input
        id={`news-${name}`}
        value={form[name] || ''}
        onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
        required={required}
      />
    </>
  )
}

export default App

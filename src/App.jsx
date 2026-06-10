import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  LockKeyhole,
  MessageCircle,
  Palette,
  Save,
  ScanText,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import rehypeSanitize from 'rehype-sanitize'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

const emptyIngredient = {
  nameInc: '',
  name: '',
  category: '',
  description: '',
  links: '',
}

const NEWS_STATUS_VALUES = {
  Draft: 0,
  Published: 1,
  Hidden: 2,
}

const NEWS_STATUS_LABELS = {
  0: 'Draft',
  1: 'Published',
  2: 'Hidden',
  Draft: 'Draft',
  Published: 'Published',
  Hidden: 'Hidden',
}

function normalizeNewsStatus(status) {
  return NEWS_STATUS_LABELS[status] || 'Published'
}

function serializeNewsStatus(status) {
  return NEWS_STATUS_VALUES[normalizeNewsStatus(status)]
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

const ADMIN_ROLE_VALUES = new Set(['admin', 'administrator', '1'])

function hasAdminRole(appUser, firebaseUser) {
  const candidates = [
    appUser?.role,
    appUser?.Role,
    appUser?.userRole,
    appUser?.UserRole,
    appUser?.roleName,
    appUser?.RoleName,
    firebaseUser?.reloadUserInfo?.customAttributes,
  ]

  if (appUser?.roles && Array.isArray(appUser.roles)) candidates.push(...appUser.roles)
  if (appUser?.Roles && Array.isArray(appUser.Roles)) candidates.push(...appUser.Roles)

  return candidates.some((value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'object') {
      return Object.values(value).some((item) =>
        ADMIN_ROLE_VALUES.has(item?.toString().toLowerCase()),
      )
    }
    return ADMIN_ROLE_VALUES.has(value.toString().trim().toLowerCase())
  })
}

function slugify(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const aboutSections = [
  {
    title: 'Cách chúng tôi xây dựng nội dung',
    body: [
      'Các nội dung trên website được tổng hợp, chọn lọc và trình bày theo hướng dễ hiểu cho người dùng phổ thông. Chúng tôi cố gắng diễn giải các khái niệm chăm sóc da một cách rõ ràng, tránh dùng quá nhiều thuật ngữ khó hiểu và giúp người dùng có thêm cơ sở khi tìm hiểu về sản phẩm hoặc quy trình chăm sóc da.',
      'Tuy nhiên, mỗi làn da có đặc điểm, tình trạng và mức độ nhạy cảm khác nhau. Một sản phẩm, thành phần hoặc quy trình phù hợp với người này chưa chắc sẽ phù hợp với người khác. Vì vậy, nội dung trên website chỉ nên được xem là nguồn thông tin tham khảo, không phải kết luận tuyệt đối cho mọi trường hợp.',
    ],
  },
  {
    title: 'Vai trò của website',
    body: [
      'Website này không phải là cơ sở khám chữa bệnh và không cung cấp dịch vụ chẩn đoán, điều trị, kê đơn hoặc tư vấn y khoa cá nhân. Nội dung trên website không nhằm thay thế cho việc thăm khám, chẩn đoán hoặc tư vấn trực tiếp từ bác sĩ da liễu hay chuyên gia y tế có chuyên môn.',
      'Các thông tin, gợi ý hoặc nội dung liên quan đến chăm sóc da trên website chỉ mang tính chất tham khảo chung. Website không cam kết rằng một sản phẩm, thành phần hoặc quy trình chăm sóc da sẽ phù hợp hoặc mang lại hiệu quả giống nhau cho tất cả người dùng.',
      'Với các tình trạng như mụn viêm nặng, kích ứng kéo dài, dị ứng, viêm da, tổn thương da, da đau rát bất thường hoặc bất kỳ vấn đề da liễu nghiêm trọng nào, người dùng nên tham khảo ý kiến bác sĩ da liễu trước khi áp dụng sản phẩm hoặc quy trình chăm sóc da.',
    ],
  },
  {
    title: 'Lưu ý khi sử dụng thông tin',
    body: [
      'Thông tin trên website được cung cấp nhằm hỗ trợ người dùng tìm hiểu thêm về chăm sóc da và có thêm cơ sở trước khi đưa ra quyết định. Người dùng nên đọc kỹ thông tin sản phẩm, kiểm tra thành phần, thử sản phẩm trên một vùng da nhỏ trước khi sử dụng rộng rãi và ngưng sử dụng nếu xuất hiện dấu hiệu kích ứng bất thường.',
      'Mọi quyết định sử dụng sản phẩm, áp dụng quy trình chăm sóc da hoặc thay đổi thói quen chăm sóc da là lựa chọn cá nhân của người dùng. Website chỉ đóng vai trò cung cấp thông tin tham khảo và không chịu trách nhiệm thay cho quyết định sử dụng sản phẩm hoặc phương pháp chăm sóc da của từng cá nhân.',
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
    if (window.location.pathname === '/chat') return 'chat'
    if (window.location.pathname === '/ingredients') return 'ingredients'
    if (window.location.pathname === '/admin/news') return 'admin-news'
    if (window.location.pathname === '/admin/ingredients') return 'admin-ingredients'
    if (window.location.pathname.startsWith('/news/')) return 'news-detail'
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

  const isAdmin = hasAdminRole(authState.appUser, authState.firebaseUser)

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
      else if (window.location.pathname === '/chat') setPage('chat')
      else if (window.location.pathname === '/ingredients') setPage('ingredients')
      else if (window.location.pathname === '/admin/news') setPage('admin-news')
      else if (window.location.pathname === '/admin/ingredients') setPage('admin-ingredients')
      else if (window.location.pathname.startsWith('/news/')) setPage('news-detail')
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
  const goChat = () => navigate('chat', '/chat')
  const goIngredients = () => navigate('ingredients', '/ingredients')
  const goAdminNews = () => navigate('admin-news', '/admin/news')
  const goAdminIngredients = () => navigate('admin-ingredients', '/admin/ingredients')
  const goNewsDetail = (slug) => navigate('news-detail', `/news/${slug}`)

  const logout = async () => {
    await logoutFirebase()
    if (page === 'admin-news' || page === 'admin-ingredients') goHome()
  }

  if (page === 'about') {
    return (
      <>
        <AboutPage
          active="about"
          authState={authState}
          goAbout={goAbout}
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
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
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  if (page === 'admin-ingredients') {
    return (
      <>
        <AdminIngredientsPage
          authState={authState}
          goAbout={goAbout}
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  if (page === 'news-detail') {
    return (
      <>
        <NewsDetailPage
          authState={authState}
          goAbout={goAbout}
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  if (page === 'chat') {
    return (
      <>
        <ChatPage
          active="chat"
          authState={authState}
          goAbout={goAbout}
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
          isAdmin={isAdmin}
          logout={logout}
          openLogin={() => setLoginOpen(true)}
        />
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  if (page === 'ingredients') {
    return (
      <>
        <IngredientLookupPage
          active="ingredients"
          authState={authState}
          goAbout={goAbout}
          goChat={goChat}
          goIngredients={goIngredients}
          goAdminIngredients={goAdminIngredients}
          goAdminNews={goAdminNews}
          goHome={goHome}
          goNewsDetail={goNewsDetail}
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
        goChat={goChat}
        goIngredients={goIngredients}
        goAdminIngredients={goAdminIngredients}
        goAdminNews={goAdminNews}
        goHome={goHome}
        goNewsDetail={goNewsDetail}
        isAdmin={isAdmin}
        logout={logout}
        openLogin={() => setLoginOpen(true)}
      />

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <h1>Chuyên gia chăm sóc da của riêng bạn</h1>
          <div className="hero-actions">
            <a className="primary-btn" href={appLink}>
              Truy cập ứng dụng <ArrowRight size={18} />
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
                  <button type="button" onClick={() => goNewsDetail(post.slug)}>
                    Đọc bài viết
                  </button>
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
  goIngredients,
  goAdminNews,
  goAdminIngredients,
  isAdmin,
  logout,
  openLogin,
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [widgetMessages, setWidgetMessages] = useState([
    {
      role: 'assistant',
      content:
        'Chào bạn, mình là Belumi chatbot. Mình có thể hỗ trợ về routine, loại da và thành phần mỹ phẩm.',
    },
  ])
  const [widgetInput, setWidgetInput] = useState('')
  const [widgetLoading, setWidgetLoading] = useState(false)
  const [widgetError, setWidgetError] = useState('')

  const sendWidgetMessage = async (event) => {
    event.preventDefault()
    const text = widgetInput.trim()
    if (!text || widgetLoading) return

    setWidgetMessages((prev) => [...prev, { role: 'user', content: text }])
    setWidgetInput('')
    setWidgetLoading(true)
    setWidgetError('')

    try {
      const data = await apiFetch('/chatbot/message', {
        method: 'POST',
        body: { message: text, skinType: null },
      })
      setWidgetMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || 'Mình chưa có câu trả lời cho câu hỏi này.',
          sources: data?.sources || [],
        },
      ])
    } catch (err) {
      setWidgetError(err.message || 'Không gửi được tin nhắn.')
      setWidgetMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Có lỗi khi gọi chatbot. Bạn thử lại sau nhé.' },
      ])
    } finally {
      setWidgetLoading(false)
    }
  }

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
        <button
          type="button"
          className={active === 'about' ? 'is-active' : undefined}
          onClick={goAbout}
        >
          Giới thiệu
        </button>
        <button type="button" onClick={() => goHome('#features')}>
          Tính năng
        </button>
        <button type="button" onClick={() => goHome('#news')}>
          Blogs/News
        </button>
        <button
          type="button"
          className={active === 'ingredients' ? 'is-active' : undefined}
          onClick={goIngredients}
        >
          Tra cứu thành phần
        </button>
        {isAdmin && (
          <>
            <button
              type="button"
              className={active === 'admin-news' ? 'is-active' : undefined}
              onClick={goAdminNews}
            >
              News
            </button>
            <button
              type="button"
              className={active === 'admin-ingredients' ? 'is-active' : undefined}
              onClick={goAdminIngredients}
            >
              Ingredients
            </button>
          </>
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
      {active !== 'chat' && (
        <div className="chat-widget">
          {chatOpen && (
            <section className="chat-widget-window" aria-label="Belumi chatbot">
              <div className="chat-widget-head">
                <button type="button" onClick={() => setChatOpen(false)} aria-label="Đóng chatbot">
                  <X size={17} />
                </button>
                <span>
                  <MessageCircle size={18} />
                  Belumi Chatbot
                </span>
              </div>
              <div className="chat-widget-body">
                {widgetMessages.map((message, index) => (
                  <article className={`chat-widget-bubble ${message.role}`} key={`${message.role}-${index}`}>
                    <MarkdownContent content={message.content} />
                    {message.sources?.length > 0 && (
                      <div className="chat-widget-sources">
                        {message.sources.map((source) => (
                          <a href={source.url || '#'} key={`${source.label}-${source.url}`} target="_blank" rel="noreferrer">
                            {source.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {widgetLoading && <p className="chat-widget-status">Đang trả lời...</p>}
                {widgetError && <p className="chat-widget-error">{widgetError}</p>}
              </div>
              <form className="chat-widget-input" onSubmit={sendWidgetMessage}>
                <input
                  placeholder="Nhập tin nhắn..."
                  value={widgetInput}
                  onChange={(event) => setWidgetInput(event.target.value)}
                />
                <button type="submit" disabled={widgetLoading || !widgetInput.trim()} aria-label="Gửi tin nhắn">
                  <Send size={17} />
                </button>
              </form>
            </section>
          )}
          <button
            className="chat-fab"
            type="button"
            onClick={() => setChatOpen((value) => !value)}
            aria-label={chatOpen ? 'Đóng chatbot' : 'Mở chatbot'}
            title="Chatbot"
          >
            {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          </button>
        </div>
      )}
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

function NewsDetailPage(props) {
  const [post, setPost] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  const [activeHeading, setActiveHeading] = useState('')
  const slug = decodeURIComponent(window.location.pathname.replace('/news/', ''))
  const tableOfContents = useMemo(
    () => extractMarkdownHeadings(post?.content),
    [post?.content],
  )

  useEffect(() => {
    let ignore = false
    async function loadDetail() {
      setState({ loading: true, error: '' })
      try {
        const data = await apiFetch(`/news/${slug}`)
        if (!ignore) {
          setPost(data)
          setState({ loading: false, error: '' })
        }
      } catch (err) {
        if (!ignore) {
          setState({
            loading: false,
            error: err.message || 'Không tải được bài viết.',
          })
        }
      }
    }
    loadDetail()
    return () => {
      ignore = true
    }
  }, [slug])

  useEffect(() => {
    if (!tableOfContents.length) return undefined

    const headingElements = tableOfContents
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean)

    if (!headingElements.length) return undefined

    setActiveHeading(tableOfContents[0].id)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visibleEntry?.target?.id) {
          setActiveHeading(visibleEntry.target.id)
        }
      },
      {
        rootMargin: '-120px 0px -65% 0px',
        threshold: 0.01,
      },
    )

    headingElements.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [tableOfContents])

  const jumpToHeading = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main>
      <SiteNav {...props} />
      <article className="news-detail-page">
        <button className="back-button" type="button" onClick={() => props.goHome('#news')}>
          Quay lại Blogs/News
        </button>
        {state.loading && <p className="section-note">Đang tải bài viết...</p>}
        {state.error && <p className="form-error">{state.error}</p>}
        {post && (
          <>
            <header className="news-detail-hero">
              <div>
                <p className="eyebrow">{post.category || 'Blogs / News'}</p>
                <h1>{post.title}</h1>
                <p>{post.summary}</p>
                <span>
                  {post.author || 'Belumi Team'} · {post.viewCount ?? 0} lượt xem
                </span>
              </div>
              {post.coverImageUrl && <img src={post.coverImageUrl} alt="" />}
            </header>
            <div className="news-detail-body">
              {tableOfContents.length > 0 && (
                <aside className="news-toc" aria-label="Muc luc bai viet">
                  <p>Trong bài viết</p>
                  <nav>
                    {tableOfContents.map((heading) => (
                      <button
                        className={[
                          activeHeading === heading.id ? 'is-active' : '',
                          heading.level === 3 ? 'is-nested' : '',
                        ].filter(Boolean).join(' ')}
                        type="button"
                        key={heading.id}
                        onClick={() => jumpToHeading(heading.id)}
                      >
                        {heading.text}
                      </button>
                    ))}
                  </nav>
                </aside>
              )}
              <section className="news-detail-content">
                <MarkdownContent content={post.content} />
              </section>
            </div>
          </>
        )}
      </article>
    </main>
  )
}

function MarkdownContent({ content }) {
  const components = useMemo(
    () => ({
      h2: ({ children, ...props }) => (
        <h2 id={headingIdFromChildren(children)} {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 id={headingIdFromChildren(children)} {...props}>
          {children}
        </h3>
      ),
    }),
    [],
  )

  return (
    <ReactMarkdown
      components={components}
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
    >
      {normalizeMarkdownContent(content)}
    </ReactMarkdown>
  )
}

function extractMarkdownHeadings(content) {
  const normalized = normalizeMarkdownContent(content)
  const usedIds = new Map()

  return normalized
    .split('\n')
    .map((line) => line.match(/^(#{2})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => {
      const level = match[1].length
      const text = stripMarkdownInline(match[2])
      const baseId = slugify(text) || 'section'
      const count = usedIds.get(baseId) || 0
      usedIds.set(baseId, count + 1)
      return {
        level,
        text,
        id: count ? `${baseId}-${count + 1}` : baseId,
      }
    })
}

function stripMarkdownInline(value) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#+$/, '')
    .trim()
}

function headingIdFromChildren(children) {
  return slugify(flattenReactText(children)) || undefined
}

function flattenReactText(value) {
  if (Array.isArray(value)) return value.map(flattenReactText).join('')
  if (value === null || value === undefined || typeof value === 'boolean') return ''
  if (typeof value === 'object' && 'props' in value) return flattenReactText(value.props.children)
  return String(value)
}

function normalizeMarkdownContent(content) {
  if (!content) return ''

  const hasEscapedNewlines = content.includes('\\n')
  const hasRealNewlines = content.includes('\n')

  if (hasEscapedNewlines && !hasRealNewlines) {
    return content.replaceAll('\\n', '\n')
  }

  return content
}

function ChatPage(props) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Chào bạn, mình là Belumi chatbot. Bạn có thể hỏi về routine, loại da hoặc thành phần mỹ phẩm.',
    },
  ])
  const [input, setInput] = useState('')
  const [skinType, setSkinType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/chatbot/message', {
        method: 'POST',
        body: { message: text, skinType: skinType || null },
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || 'Mình chưa có câu trả lời cho câu hỏi này.',
          sources: data?.sources || [],
          tools: data?.tools || [],
        },
      ])
    } catch (err) {
      setError(err.message || 'Không gửi được tin nhắn.')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Có lỗi khi gọi chatbot. Bạn thử lại sau nhé.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <SiteNav {...props} />
      <section className="tool-page chat-page">
        <div className="tool-hero">
          <p className="eyebrow">Belumi AI</p>
          <h1>Chatbot chăm sóc da</h1>
          <p>Hỏi nhanh về routine, loại da, thành phần mỹ phẩm và dữ liệu skincare trong Belumi.</p>
        </div>

        <section className="chat-shell">
          <aside className="chat-side">
            <MessageCircle size={24} />
            <h2>Ngữ cảnh</h2>
            <label>
              Loại da
              <select value={skinType} onChange={(event) => setSkinType(event.target.value)}>
                <option value="">Chưa chọn</option>
                <option value="oily">Da dầu</option>
                <option value="dry">Da khô</option>
                <option value="combination">Da hỗn hợp</option>
                <option value="sensitive">Da nhạy cảm</option>
                <option value="normal">Da thường</option>
              </select>
            </label>
            <p>Chatbot đang gọi trực tiếp API backend qua endpoint public.</p>
          </aside>

          <div className="chat-window">
            <div className="chat-messages">
              {messages.map((message, index) => (
                <article className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                  <MarkdownContent content={message.content} />
                  {message.sources?.length > 0 && (
                    <div className="chat-sources">
                      {message.sources.map((source) => (
                        <a href={source.url || '#'} key={`${source.label}-${source.url}`} target="_blank" rel="noreferrer">
                          {source.label}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
              {loading && <p className="section-note">Đang soạn câu trả lời...</p>}
              {error && <p className="form-error">{error}</p>}
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input
                placeholder="Ví dụ: Da dầu mụn có nên dùng niacinamide không?"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button className="primary-btn" disabled={loading || !input.trim()} type="submit">
                <Send size={18} /> Gửi
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}

function IngredientLookupPage(props) {
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [selected, setSelected] = useState(null)
  const [scanText, setScanText] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    let ignore = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ page: '1', pageSize: '12' })
        if (search.trim()) params.set('search', search.trim())
        const data = await apiFetch(`/ingredients?${params.toString()}`)
        if (!ignore) setIngredients(data?.items || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được ingredient.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }, 250)

    return () => {
      ignore = true
      window.clearTimeout(timer)
    }
  }, [search])

  const analyzeIngredientText = async (event) => {
    event.preventDefault()
    if (!scanText.trim()) return
    setScanLoading(true)
    setScanError('')
    setScanResult(null)
    try {
      const data = await apiFetch('/ingredients/scan', {
        method: 'POST',
        body: { inputText: scanText.trim(), skinType: null, allergies: [] },
      })
      setScanResult(data)
    } catch (err) {
      setScanError(err.message || 'Không phân tích được bảng thành phần.')
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <main>
      <SiteNav {...props} />
      <section className="tool-page ingredient-page">
        <div className="tool-hero">
          <p className="eyebrow">Ingredient database</p>
          <h1>Tra cứu thành phần mỹ phẩm</h1>
          <p>Tìm ingredient thật từ database backend hoặc dán bảng thành phần để phân tích nhanh.</p>
        </div>

        <section className="ingredient-layout">
          <div className="ingredient-search-panel">
            <label className="search-box">
              <Search size={18} />
              <input
                placeholder="Tìm INCI, tên thường gọi, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {loading && <p className="section-note">Đang tải ingredient...</p>}
            {error && <p className="form-error">{error}</p>}
            {!loading && ingredients.length === 0 && (
              <p className="section-note">Chưa có ingredient phù hợp.</p>
            )}

            <div className="ingredient-results">
              {ingredients.map((ingredient) => (
                <button
                  className={selected?.id === ingredient.id ? 'ingredient-result is-active' : 'ingredient-result'}
                  key={ingredient.id}
                  type="button"
                  onClick={() => setSelected(ingredient)}
                >
                  <span>{ingredient.category || 'Ingredient'}</span>
                  <strong>{ingredient.nameInc}</strong>
                  <small>{ingredient.name}</small>
                </button>
              ))}
            </div>
          </div>

          <aside className="ingredient-detail-panel">
            {selected ? (
              <>
                <span>{selected.category}</span>
                <h2>{selected.nameInc}</h2>
                <h3>{selected.name}</h3>
                <p>{selected.description || 'Chưa có mô tả cho ingredient này.'}</p>
                {selected.links && (
                  <a href={selected.links} target="_blank" rel="noreferrer">
                    Mở nguồn tham khảo
                  </a>
                )}
              </>
            ) : (
              <>
                <ScanText size={28} />
                <h2>Chọn một ingredient</h2>
                <p>Thông tin chi tiết sẽ hiện ở đây, không cần chuyển qua trang admin.</p>
              </>
            )}
          </aside>
        </section>

        <section className="ingredient-scan-panel">
          <div>
            <p className="eyebrow">INCI analyzer</p>
            <h2>Dán bảng thành phần</h2>
            <p>Phần này dùng API scan public để đọc nhanh ingredient list dạng text.</p>
          </div>
          <form onSubmit={analyzeIngredientText}>
            <textarea
              placeholder="Ví dụ: Aqua, Niacinamide, Glycerin, Panthenol..."
              value={scanText}
              onChange={(event) => setScanText(event.target.value)}
              rows={5}
            />
            <button className="primary-btn" disabled={scanLoading || !scanText.trim()} type="submit">
              <ScanText size={18} /> {scanLoading ? 'Đang phân tích...' : 'Phân tích'}
            </button>
          </form>
          {scanError && <p className="form-error">{scanError}</p>}
          {scanResult && (
            <div className="scan-result">
              {'safetyScore' in scanResult && <strong>Safety score: {scanResult.safetyScore}</strong>}
              {Array.isArray(scanResult.recommendations) && scanResult.recommendations.length > 0 && (
                <p>Gợi ý: {scanResult.recommendations.join(', ')}</p>
              )}
              {Array.isArray(scanResult.harmful) && scanResult.harmful.length > 0 && (
                <ul>
                  {scanResult.harmful.map((item, index) => (
                    <li key={`${item.name || item.ingredient || index}`}>
                      {item.name || item.ingredient || 'Ingredient'}: {item.reason || 'Cần lưu ý'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function AdminNewsPage(props) {
  const { authState, isAdmin, openLogin } = props
  const [news, setNews] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyNews)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState('write')
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
    setEditorOpen(true)
    setEditorMode('write')
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      summary: post.summary || '',
      content: post.content || '',
      coverImageUrl: post.coverImageUrl || '',
      category: post.category || 'Skincare',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
      author: post.author || 'Belumi Team',
      status: normalizeNewsStatus(post.status),
      publishedAt: post.publishedAt || '',
    })
  }

  const resetForm = () => {
    setSelected(null)
    setForm(emptyNews)
    setEditorMode('write')
    setEditorOpen(false)
  }

  const createPost = () => {
    setSelected(null)
    setForm(emptyNews)
    setEditorMode('write')
    setEditorOpen(true)
  }

  const savePost = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      setError('Vui lòng nhập đủ Tiêu đề, Tóm tắt và Nội dung trước khi lưu bài viết.')
      return
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags,
      status: serializeNewsStatus(form.status),
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

  const updateForm = (name, value) => {
    setForm((prev) => {
      if (name === 'title' && (!prev.slug || prev.slug === slugify(prev.title))) {
        return { ...prev, title: value, slug: slugify(value) }
      }
      return { ...prev, [name]: value }
    })
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
          <button className="primary-btn admin-create-btn" type="button" onClick={createPost}>
            Tạo bài viết
          </button>
        </div>

        <div className="admin-layout">
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
                  <span>{normalizeNewsStatus(post.status)}</span>
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
        {editorOpen && (
          <div className="modal-backdrop admin-editor-backdrop" role="presentation">
            <form className="admin-editor-modal" noValidate onSubmit={savePost}>
              <div className="admin-editor-head">
                <div>
                  <p className="eyebrow">Markdown editor</p>
                  <h2>{selected ? 'Sửa bài viết' : 'Tạo bài viết'}</h2>
                </div>
                <button className="modal-close" type="button" onClick={resetForm}>
                  <X size={18} />
                </button>
              </div>

              <div className="admin-editor-grid">
                <div className="admin-meta-fields">
                  <AdminInput
                    label="Tiêu đề"
                    name="title"
                    form={form}
                    updateForm={updateForm}
                    required
                  />
                  <AdminInput label="Slug" name="slug" form={form} updateForm={updateForm} />
                  <AdminInput
                    label="Tóm tắt"
                    name="summary"
                    form={form}
                    updateForm={updateForm}
                    required
                  />
                  <AdminInput
                    label="Ảnh bìa URL"
                    name="coverImageUrl"
                    form={form}
                    updateForm={updateForm}
                  />
                  <AdminInput
                    label="Danh mục"
                    name="category"
                    form={form}
                    updateForm={updateForm}
                    required
                  />
                  <AdminInput label="Tags" name="tags" form={form} updateForm={updateForm} />
                  <label htmlFor="news-status">Trạng thái</label>
                  <select
                    id="news-status"
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value)}
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>

                <div className="admin-content-editor">
                  <div className="editor-tabs" aria-label="Chế độ soạn thảo">
                    <button
                      className={editorMode === 'write' ? 'is-active' : undefined}
                      type="button"
                      onClick={() => setEditorMode('write')}
                    >
                      Viết Markdown
                    </button>
                    <button
                      className={editorMode === 'preview' ? 'is-active' : undefined}
                      type="button"
                      onClick={() => setEditorMode('preview')}
                    >
                      Xem trước
                    </button>
                  </div>
                  {editorMode === 'write' ? (
                    <>
                      <label htmlFor="news-content">Nội dung</label>
                      <textarea
                        id="news-content"
                        value={form.content}
                        onChange={(event) => updateForm('content', event.target.value)}
                        placeholder={'## Section heading\\n\\nWrite **bold**, *italic*, [link](https://example.com), lists, images...'}
                        required
                        rows={18}
                      />
                      <p className="editor-help">
                        Markdown supports headings, bold, italic, links, lists, quotes, tables, and images.

                      </p>
                    </>
                  ) : (
                    <article className="markdown-preview">
                      <header>
                        <p className="eyebrow">{form.category || 'Blogs / News'}</p>
                        <h1>{form.title || 'Blog title'}</h1>
                        {form.summary && <p>{form.summary}</p>}
                      </header>
                      {form.coverImageUrl && <img src={form.coverImageUrl} alt="" />}
                      <MarkdownContent content={form.content || 'No content to preview yet.'} />
                    </article>
                  )}
                </div>
              </div>

              <div className="admin-editor-actions">
                <div className="admin-editor-feedback">
                  {error && <p className="form-error">{error}</p>}
                  {message && <p className="form-success">{message}</p>}
                </div>
                <button type="button" onClick={resetForm}>
                  Hủy
                </button>
                <button className="primary-btn" type="submit">
                  <Save size={17} /> Lưu bài viết
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}

function AdminIngredientsPage(props) {
  const { authState, isAdmin, openLogin } = props
  const [ingredients, setIngredients] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyIngredient)
  const [search, setSearch] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [message, setMessage] = useState('')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setMessage('')
    setError('')
    setSaving(true)
    try {
      const path = selected ? `/ingredients/${selected.id}` : '/ingredients'
      await apiFetch(path, {
        method: selected ? 'PUT' : 'POST',
        token: authState.token,
        body: {
          nameInc: form.nameInc.trim(),
          name: form.name.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          links: form.links.trim(),
        },
      })
      setMessage(selected ? 'Đã cập nhật ingredient.' : 'Đã tạo ingredient.')
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
    setMessage('')
    setError('')
    try {
      await apiFetch(`/ingredients/${ingredient.id}`, {
        method: 'DELETE',
        token: authState.token,
      })
      setMessage('Đã xóa ingredient.')
      await loadIngredients()
    } catch (err) {
      setError(err.message || 'Không xóa được ingredient.')
    }
  }

  const importCsv = async (event) => {
    event.preventDefault()
    if (!csvFile) {
      setError('Chọn file CSV trước khi import.')
      return
    }
    setMessage('')
    setError('')
    setSaving(true)
    try {
      const body = new FormData()
      body.append('file', csvFile)
      const result = await apiFetch('/admin/ingredients/import-csv', {
        method: 'POST',
        token: authState.token,
        body,
      })
      setMessage(
        `Import xong: ${result.created} tạo mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua.`,
      )
      setCsvFile(null)
      await loadIngredients()
    } catch (err) {
      setError(err.message || 'Import CSV thất bại.')
    } finally {
      setSaving(false)
    }
  }

  if (!authState.loading && !authState.appUser) {
    return (
      <main>
        <SiteNav {...props} active="admin-ingredients" />
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
        <SiteNav {...props} active="admin-ingredients" />
        <section className="admin-page admin-empty">
          <h1>Bạn không có quyền truy cập trang quản trị</h1>
          <p>Tài khoản hiện tại không có role Admin.</p>
        </section>
      </main>
    )
  }

  return (
    <main>
      <SiteNav {...props} active="admin-ingredients" />
      <section className="admin-page">
        <div className="admin-header">
          <p className="eyebrow">Ingredient database</p>
          <h1>Quản lý ingredients</h1>
          <p>Tra cứu, tạo, sửa, xóa và import CSV ingredient từ backend server.</p>
        </div>

        <div className="admin-layout admin-ingredient-layout">
          <form className="admin-form" onSubmit={saveIngredient}>
            <div className="admin-form-head">
              <h2>{selected ? 'Sửa ingredient' : 'Tạo ingredient'}</h2>
              {selected && (
                <button type="button" onClick={resetForm}>
                  Hủy sửa
                </button>
              )}
            </div>
            <IngredientInput label="INCI" name="nameInc" form={form} setForm={setForm} required />
            <IngredientInput label="Tên hiển thị" name="name" form={form} setForm={setForm} required />
            <IngredientInput label="Category" name="category" form={form} setForm={setForm} required />
            <label htmlFor="ingredient-description">Description</label>
            <textarea
              id="ingredient-description"
              rows={7}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
            <IngredientInput label="Links" name="links" form={form} setForm={setForm} required />
            <button className="primary-btn" disabled={saving} type="submit">
              <Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu ingredient'}
            </button>
          </form>

          <div className="admin-list">
            <form className="admin-import" onSubmit={importCsv}>
              <h2>Import CSV</h2>
              <input
                accept=".csv,text/csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                type="file"
              />
              <button disabled={saving || !csvFile} type="submit">
                Import
              </button>
            </form>

            <div className="admin-list-head">
              <h2>Danh sách</h2>
              <input
                placeholder="Tìm INCI, tên, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {loading && <p>Đang tải...</p>}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            {!loading && ingredients.length === 0 && <p>Chưa có ingredient phù hợp.</p>}
            {ingredients.map((ingredient) => (
              <article className="admin-news-item ingredient-admin-item" key={ingredient.id}>
                <div>
                  <span>{ingredient.category}</span>
                  <h3>{ingredient.nameInc}</h3>
                  <p>{ingredient.name}</p>
                  <p>{ingredient.description}</p>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => editIngredient(ingredient)}>
                    <FileText size={16} /> Sửa
                  </button>
                  <button type="button" onClick={() => deleteIngredient(ingredient)}>
                    <Trash2 size={16} /> Xóa
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

function AdminInput({ label, name, form, updateForm, required }) {
  return (
    <>
      <label htmlFor={`news-${name}`}>{label}</label>
      <input
        id={`news-${name}`}
        value={form[name] || ''}
        onChange={(event) => updateForm(name, event.target.value)}
        required={required}
      />
    </>
  )
}

export default App

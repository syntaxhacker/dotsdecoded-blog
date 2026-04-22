import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type NavMode = 'traditional' | 'turbolinks'

interface RequestEntry {
  id: number
  type: 'document' | 'fetch' | 'css' | 'js' | 'img'
  url: string
  size: string
  time: number
}

const pageContent: Record<string, { title: string; body: string }> = {
  home: { title: 'Home', body: 'Welcome to MyApp. Browse our latest posts and get started.' },
  posts: { title: 'Posts', body: 'All Posts (12 results). Browse, filter, and read articles.' },
  about: { title: 'About', body: 'We are a small team building useful web applications.' },
  contact: { title: 'Contact', body: 'Reach out at hello@example.com. We respond within 24h.' },
}

const traditionalRequests: Record<string, RequestEntry[]> = {
  home: [
    { id: 1, type: 'document', url: '/home', size: '45.2 KB', time: 320 },
    { id: 2, type: 'css', url: 'application.css', size: '128 KB', time: 85 },
    { id: 3, type: 'js', url: 'application.js', size: '95 KB', time: 110 },
    { id: 4, type: 'img', url: 'logo.svg', size: '2.1 KB', time: 22 },
  ],
  posts: [
    { id: 1, type: 'document', url: '/posts', size: '52.1 KB', time: 340 },
    { id: 2, type: 'css', url: 'application.css', size: '128 KB', time: 82 },
    { id: 3, type: 'js', url: 'application.js', size: '95 KB', time: 105 },
    { id: 4, type: 'img', url: 'logo.svg', size: '2.1 KB', time: 20 },
  ],
  about: [
    { id: 1, type: 'document', url: '/about', size: '38.7 KB', time: 290 },
    { id: 2, type: 'css', url: 'application.css', size: '128 KB', time: 80 },
    { id: 3, type: 'js', url: 'application.js', size: '95 KB', time: 100 },
    { id: 4, type: 'img', url: 'logo.svg', size: '2.1 KB', time: 18 },
  ],
}

const turbolinksRequests: Record<string, RequestEntry[]> = {
  home: [],
  posts: [
    { id: 1, type: 'fetch', url: '/posts', size: '8.4 KB', time: 95 },
  ],
  about: [
    { id: 1, type: 'fetch', url: '/about', size: '5.2 KB', time: 78 },
  ],
}

const typeColors: Record<string, string> = {
  document: s.red,
  fetch: s.green,
  css: s.purple,
  js: s.yellow,
  img: s.orange,
}

export default function TurbolinksDemo() {
  const [currentPage, setCurrentPage] = useState('home')
  const [mode, setMode] = useState<NavMode>('traditional')
  const [isNavigating, setIsNavigating] = useState(false)
  const [flashVisible, setFlashVisible] = useState(false)
  const [visibleRequests, setVisibleRequests] = useState<number>(0)
  const [requestLog, setRequestLog] = useState<RequestEntry[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = (page: string) => {
    if (page === currentPage || isNavigating) return

    setIsNavigating(true)
    setRequestLog([])
    setVisibleRequests(0)

    const requests = mode === 'traditional' ? traditionalRequests[page] : turbolinksRequests[page]

    if (mode === 'traditional') {
      setFlashVisible(true)
      timerRef.current = setTimeout(() => {
        setFlashVisible(false)
      }, 300)
    }

    let delay = mode === 'traditional' ? 400 : 150
    let totalLoaded = 0

    requests.forEach((req, idx) => {
      timerRef.current = setTimeout(() => {
        setRequestLog((prev) => [...prev, req])
        totalLoaded++
        setVisibleRequests(totalLoaded)
        if (totalLoaded === requests.length) {
          timerRef.current = setTimeout(() => {
            setCurrentPage(page)
            setIsNavigating(false)
          }, 200)
        }
      }, delay + idx * (mode === 'traditional' ? 200 : 0))
    })

    if (requests.length === 0) {
      timerRef.current = setTimeout(() => {
        setCurrentPage(page)
        setIsNavigating(false)
      }, 200)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const page = pageContent[currentPage]
  const totalSize = requestLog.reduce((sum, r) => sum + parseFloat(r.size), 0).toFixed(1)
  const totalTime = requestLog.length > 0 ? Math.max(...requestLog.map((r) => r.time)) : 0

  return (
    <DemoBoundary name="Turbolinks Navigation">
    <div style={{ background: s.bg, padding: '28px 20px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Turbolinks: SPA-like Navigation</div>
        <div style={{ display: 'flex', gap: 4, background: s.bg3, borderRadius: 8, padding: 3 }}>
          {(['traditional', 'turbolinks'] as NavMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setRequestLog([]); setVisibleRequests(0) }}
              style={{
                background: mode === m ? (m === 'traditional' ? s.red : s.green) : 'transparent',
                border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                color: mode === m ? '#fff' : s.text2,
                fontSize: 12, fontWeight: mode === m ? 700 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {m === 'traditional' ? 'Traditional' : 'Turbolinks'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {Object.keys(pageContent).map((key) => (
          <button
            key={key}
            onClick={() => navigate(key)}
            disabled={isNavigating}
            style={{
              background: currentPage === key ? s.accent : s.bg2,
              border: `1px solid ${currentPage === key ? s.accent : s.border}`,
              borderRadius: 6, padding: '6px 14px', cursor: isNavigating ? 'not-allowed' : 'pointer',
              color: currentPage === key ? '#fff' : s.text2,
              fontSize: 12, fontWeight: currentPage === key ? 700 : 400,
              opacity: isNavigating ? 0.5 : 1, transition: 'all 0.2s ease',
              textTransform: 'capitalize',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Browser</span>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>{mode === 'traditional' ? 'Full reload' : 'Body swap only'}</span>
          </div>
          <div style={{
            background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
            overflow: 'hidden', position: 'relative', height: 200,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 28,
              background: s.bg3, borderBottom: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
              <div style={{
                flex: 1, marginLeft: 8, background: s.bg, borderRadius: 4,
                padding: '2px 8px', fontFamily: s.mono, fontSize: 10, color: s.text3,
              }}>
                myapp.com/{currentPage}
              </div>
            </div>
            <div style={{
              padding: '12px 16px', position: 'relative',
              opacity: flashVisible ? 0.3 : 1, transition: 'opacity 0.15s ease',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 6 }}>{page.title}</div>
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>{page.body}</div>
              {isNavigating && mode === 'traditional' && (
                <div style={{ position: 'absolute', inset: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 10px 10px' }}>
                  <div style={{ fontSize: 12, color: s.text3 }}>Loading...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Network Requests</span>
            {requestLog.length > 0 && (
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.accent }}>
                {totalSize} KB / {totalTime}ms
              </span>
            )}
          </div>
          <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: '10px 12px', height: 200, overflowY: 'auto' }}>
            {requestLog.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ color: s.text3, fontSize: 12 }}>
                  {mode === 'turbolinks' && currentPage === 'home' ? 'Home loaded initially -- no fetch needed' : 'Click a page to see requests'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {requestLog.map((req) => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: s.bg, borderRadius: 6, padding: '6px 10px',
                    borderLeft: `3px solid ${typeColors[req.type]}`,
                  }}>
                    <span style={{
                      background: typeColors[req.type], borderRadius: 3, padding: '1px 6px',
                      fontFamily: s.mono, fontSize: 9, color: '#fff', fontWeight: 700, textTransform: 'uppercase', minWidth: 48, textAlign: 'center',
                    }}>
                      {req.type}
                    </span>
                    <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, flex: 1 }}>{req.url}</span>
                    <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>{req.size}</span>
                    <span style={{ fontFamily: s.mono, fontSize: 10, color: req.time < 100 ? s.green : s.yellow }}>{req.time}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 12, color: s.text2, lineHeight: 1.6 }}>
        {mode === 'traditional'
          ? <>Traditional navigation downloads <strong style={{ color: s.red }}>all assets on every page change</strong>: HTML document, CSS, JS, images. The entire page is destroyed and rebuilt.</>
          : <>Turbolinks only fetches the <strong style={{ color: s.green }}>HTML body</strong> via XHR and swaps it in place. CSS and JS are preserved -- the page never fully reloads.</>
        }
      </div>
    </div>
    </DemoBoundary>
  )
}

import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

type RouteType = 'default' | 'member' | 'collection'

interface Route {
  verb: string
  path: string
  helper: string
  action: string
  type: RouteType
  desc: string
}

const defaultRoutes: Route[] = [
  { verb: 'GET', path: '/posts', helper: 'posts_path', action: 'index', type: 'default', desc: 'List all posts' },
  { verb: 'GET', path: '/posts/new', helper: 'new_post_path', action: 'new', type: 'default', desc: 'Form to create a new post' },
  { verb: 'POST', path: '/posts', helper: 'posts_path', action: 'create', type: 'default', desc: 'Save a new post' },
  { verb: 'GET', path: '/posts/:id', helper: 'post_path(:id)', action: 'show', type: 'default', desc: 'Show a single post' },
  { verb: 'GET', path: '/posts/:id/edit', helper: 'edit_post_path(:id)', action: 'edit', type: 'default', desc: 'Form to edit a post' },
  { verb: 'PATCH', path: '/posts/:id', helper: 'post_path(:id)', action: 'update', type: 'default', desc: 'Update a post' },
  { verb: 'DELETE', path: '/posts/:id', helper: 'post_path(:id)', action: 'destroy', type: 'default', desc: 'Delete a post' },
]

const memberRoutes: Route[] = [
  { verb: 'GET', path: '/posts/:id/profile', helper: 'profile_post_path(:id)', action: 'profile', type: 'member', desc: 'View the author profile for this post' },
  { verb: 'POST', path: '/posts/:id/publish', helper: 'publish_post_path(:id)', action: 'publish', type: 'member', desc: 'Publish a draft post' },
]

const collectionRoutes: Route[] = [
  { verb: 'GET', path: '/posts/search', helper: 'search_posts_path', action: 'search', type: 'collection', desc: 'Search across all posts' },
  { verb: 'GET', path: '/posts/drafts', helper: 'drafts_posts_path', action: 'drafts', type: 'collection', desc: 'List all draft posts' },
]

const allRoutes = [...defaultRoutes, ...memberRoutes, ...collectionRoutes]

const verbColor: Record<string, string> = {
  GET: s.green,
  POST: s.accent,
  PATCH: s.yellow,
  DELETE: s.red,
}

const memberCode = `# routes.rb
resources :posts do
  member do
    get "profile", to: "posts#profile"
    post "publish", to: "posts#publish"
  end
end`

const collectionCode = `# routes.rb
resources :posts do
  collection do
    get "search", to: "posts#search"
    get "drafts", to: "posts#drafts"
  end
end`

const memberCodeHtml = Prism.highlight(memberCode, Prism.languages.ruby, 'ruby')
const collectionCodeHtml = Prism.highlight(collectionCode, Prism.languages.ruby, 'ruby')

export default function RouteTypesDemo() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [showType, setShowType] = useState<'all' | 'member' | 'collection'>('all')

  const filteredRoutes = showType === 'all' ? allRoutes : showType === 'member' ? memberRoutes : collectionRoutes

  return (
    <DemoBoundary name="Route Types">
    <div className="rtc" style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>RESTful Routes Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Rails generates seven default routes for each resource. You can also add member routes (acting on a single resource) and collection routes (acting on the whole collection). Click any route for details.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'member', 'collection'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setShowType(t); setSelectedRoute(null) }}
              style={{
                background: showType === t ? s.accent : s.bg3,
                border: `1px solid ${showType === t ? s.accent : s.border}`,
                borderRadius: 8, padding: '6px 16px',
                color: showType === t ? '#fff' : s.text2,
                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                fontWeight: showType === t ? 600 : 400,
              }}
            >
              {t === 'all' ? 'All Routes' : t === 'member' ? 'Member Routes' : 'Collection Routes'}
            </button>
          ))}
        </div>
        {showType !== 'all' && (
          <div style={{
            background: showType === 'member' ? `${s.orange}15` : `${s.purple}15`,
            border: `1px solid ${showType === 'member' ? `${s.orange}33` : `${s.purple}33`}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, lineHeight: 1.5,
            color: showType === 'member' ? s.orange : s.purple,
          }}>
            {showType === 'member'
              ? 'Member routes require an :id -- they operate on a specific resource instance.'
              : 'Collection routes do NOT require an :id -- they operate on the entire collection.'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {filteredRoutes.map((route, i) => (
            <button
              key={`${route.verb}-${route.path}-${i}`}
              onClick={() => setSelectedRoute(route)}
              style={{
                background: selectedRoute === route ? s.bg3 : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{
                ...M, fontSize: 10, fontWeight: 700, color: verbColor[route.verb] || s.text2,
                width: 50, textAlign: 'right', flexShrink: 0,
              }}>
                {route.verb}
              </span>
              <span style={{ ...M, fontSize: 12, color: s.text, flex: 1 }}>{route.path}</span>
              <span style={{ ...M, fontSize: 11, color: s.text3 }}>#{route.action}</span>
              {route.type !== 'default' && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: route.type === 'member' ? s.orange : s.purple,
                  textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
                  background: route.type === 'member' ? `${s.orange}22` : `${s.purple}22`,
                  flexShrink: 0,
                }}>
                  {route.type}
                </span>
              )}
            </button>
          ))}
        </div>
        {selectedRoute && (
          <div style={{
            background: s.bg3, borderRadius: 10, padding: 20,
            border: `1px solid ${verbColor[selectedRoute.verb]}44`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{
                ...M, fontSize: 13, fontWeight: 700, color: verbColor[selectedRoute.verb],
                padding: '4px 10px', borderRadius: 6,
                background: `${verbColor[selectedRoute.verb]}22`,
              }}>
                {selectedRoute.verb}
              </span>
              <span style={{ ...M, fontSize: 15, color: s.text, fontWeight: 600 }}>{selectedRoute.path}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Helper Method</div>
                <div style={{ ...M, fontSize: 13, color: s.accent }}>{selectedRoute.helper}</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Controller Action</div>
                <div style={{ ...M, fontSize: 13, color: s.green }}>#{selectedRoute.action}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: s.text2, lineHeight: 1.5 }}>{selectedRoute.desc}</div>
            {selectedRoute.type === 'member' && (
              <div style={{ marginTop: 10, ...M, fontSize: 11, whiteSpace: 'pre', background: s.bg, borderRadius: 6, padding: '10px 14px', border: `1px solid ${s.border}` }}>
                <code dangerouslySetInnerHTML={{ __html: memberCodeHtml }} />
              </div>
            )}
            {selectedRoute.type === 'collection' && (
              <div style={{ marginTop: 10, ...M, fontSize: 11, whiteSpace: 'pre', background: s.bg, borderRadius: 6, padding: '10px 14px', border: `1px solid ${s.border}` }}>
                <code dangerouslySetInnerHTML={{ __html: collectionCodeHtml }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    <style>{`
      .rtc code .token.keyword { color: #f92672; }
      .rtc code .token.string, .rtc code .token.char, .rtc code .token.builtin, .rtc code .token.inserted { color: #e6db74; }
      .rtc code .token.number, .rtc code .token.constant, .rtc code .token.symbol, .rtc code .token.property, .rtc code .token.tag, .rtc code .token.boolean, .rtc code .token.deleted { color: #ae81ff; }
      .rtc code .token.selector, .rtc code .token.attr-name { color: #f92672; }
      .rtc code .token.attr-value, .rtc code .token.atrule { color: #e6db74; }
      .rtc code .token.function, .rtc code .token.class-name { color: #a6e22e; }
      .rtc code .token.operator, .rtc code .token.entity, .rtc code .token.url, .rtc code .token.punctuation { color: #f8f8f2; }
      .rtc code .token.comment, .rtc code .token.prolog, .rtc code .token.doctype, .rtc code .token.cdata { color: #75715e; font-style: italic; }
      .rtc code .token.parameter, .rtc code .token.variable, .rtc code .token.regex, .rtc code .token.important { color: #fd971f; }
    `}</style>
    </DemoBoundary>
  )
}

import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface ModelNode {
  id: string
  label: string
  x: number
  y: number
  color: string
}

interface Association {
  id: string
  from: string
  to: string
  label: string
  macro: string
  queries: string[]
  active: boolean
}

const models: ModelNode[] = [
  { id: 'user', label: 'User', x: 200, y: 80, color: s.accent },
  { id: 'post', label: 'Post', x: 480, y: 40, color: s.green },
  { id: 'comment', label: 'Comment', x: 480, y: 170, color: s.purple },
  { id: 'tag', label: 'Tag', x: 720, y: 100, color: s.orange },
]

const associations: Association[] = [
  {
    id: 'u_posts',
    from: 'user', to: 'post',
    label: 'has_many :posts',
    macro: 'class User < ApplicationRecord\n  has_many :posts\nend\n\nclass Post < ApplicationRecord\n  belongs_to :user\nend',
    queries: [
      'user = User.first',
      'user.posts',
      '# SELECT * FROM posts WHERE user_id = 1',
      'post = Post.first',
      'post.user',
      '# SELECT * FROM users WHERE id = 1',
    ],
    active: true,
  },
  {
    id: 'p_comments',
    from: 'post', to: 'comment',
    label: 'has_many :comments',
    macro: 'class Post < ApplicationRecord\n  has_many :comments\n  belongs_to :user\nend\n\nclass Comment < ApplicationRecord\n  belongs_to :post\nend',
    queries: [
      'post = Post.first',
      'post.comments',
      '# SELECT * FROM comments WHERE post_id = 1',
      'comment = Comment.first',
      'comment.post',
      '# SELECT * FROM posts WHERE id = 1',
    ],
    active: true,
  },
  {
    id: 'p_tags',
    from: 'post', to: 'tag',
    label: 'has_many :through',
    macro: 'class Post < ApplicationRecord\n  has_many :taggings\n  has_many :tags, through: :taggings\nend\n\nclass Tag < ApplicationRecord\n  has_many :taggings\n  has_many :posts, through: :taggings\nend',
    queries: [
      'post = Post.first',
      'post.tags',
      '# SELECT tags.* FROM tags',
      '# INNER JOIN taggings ON tags.id = taggings.tag_id',
      '# WHERE taggings.post_id = 1',
      'tag = Tag.find_by(name: "rails")',
      'tag.posts',
      '# SELECT posts.* FROM posts',
      '# INNER JOIN taggings ON posts.id = taggings.post_id',
      '# WHERE taggings.tag_id = 3',
    ],
    active: true,
  },
]

export default function AssociationDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [assocs, setAssocs] = useState(associations)

  const toggleAssoc = (id: string) => {
    setAssocs(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  const selectedAssoc = assocs.find(a => a.id === selected)

  const macroHtml = useMemo(() => {
    if (!selectedAssoc) return ''
    return Prism.highlight(selectedAssoc.macro, Prism.languages.ruby, 'ruby')
  }, [selectedAssoc])

  const getLinePath = (from: ModelNode, to: ModelNode) => {
    const fx = from.x + 80
    const fy = from.y + 22
    const tx = to.x
    const ty = to.y + 22
    const cx1 = fx + (tx - fx) * 0.5
    return `M ${fx} ${fy} C ${cx1} ${fy}, ${cx1} ${ty}, ${tx} ${ty}`
  }

  const w = 820
  const h = 260

  return (
    <DemoBoundary name="Association Demo">
      <div className="adc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {assocs.map(a => (
            <button
              key={a.id}
              onClick={() => toggleAssoc(a.id)}
              style={{
                background: a.active ? s.bg2 : s.bg,
                border: `1px solid ${a.active ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '5px 10px',
                color: a.active ? s.accent : s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {a.active ? 'ON' : 'OFF'} -- {a.label.split(':')[0]}
            </button>
          ))}
        </div>

        <div style={{ overflow: 'hidden', borderRadius: 8, border: `1px solid ${s.border}` }}>
          <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
            {assocs.filter(a => a.active).map(a => {
              const from = models.find(m => m.id === a.from)!
              const to = models.find(m => m.id === a.to)!
              const isSelected = selected === a.id
              return (
                <g key={a.id}>
                  <path
                    d={getLinePath(from, to)}
                    fill="none"
                    stroke={isSelected ? a.to === 'tag' ? s.orange : a.to === 'comment' ? s.purple : s.green : s.border2}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={a.label.includes('through') ? '6,4' : 'none'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(isSelected ? null : a.id)}
                  />
                  {isSelected && (
                    <text x={(from.x + to.x) / 2 + 40} y={Math.min(from.y, to.y) - 6} fill={s.yellow} fontSize="11" fontFamily={s.mono} textAnchor="middle">
                      {a.label}
                    </text>
                  )}
                </g>
              )
            })}
            {models.map(m => (
              <g key={m.id}>
                <rect x={m.x} y={m.y} width={160} height={44} rx={8} fill={s.bg2} stroke={m.color} strokeWidth={1.5} />
                <text x={m.x + 80} y={m.y + 27} fill={m.color} fontSize="14" fontFamily={s.mono} fontWeight="bold" textAnchor="middle">{m.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {selectedAssoc && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Model Code</div>
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: 12,
                fontFamily: s.mono,
                fontSize: 11,
                lineHeight: 1.6,
                whiteSpace: 'pre' as const,
              }}>
                <code dangerouslySetInnerHTML={{ __html: macroHtml }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Usage</div>
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: 12,
                fontFamily: s.mono,
                fontSize: 11,
                lineHeight: 1.6,
                maxHeight: 180,
                overflowY: 'auto' as const,
              }}>
                {selectedAssoc.queries.map((q, i) => (
                  <div key={i} style={{ color: q.startsWith('#') ? s.text3 : i % 2 === 0 ? s.accent : s.green, marginBottom: 1 }}>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .adc code .token.keyword { color: #f92672; }
        .adc code .token.string, .adc code .token.char, .adc code .token.builtin, .adc code .token.inserted { color: #e6db74; }
        .adc code .token.number, .adc code .token.constant, .adc code .token.symbol, .adc code .token.property, .adc code .token.tag, .adc code .token.boolean, .adc code .token.deleted { color: #ae81ff; }
        .adc code .token.selector, .adc code .token.attr-name { color: #f92672; }
        .adc code .token.attr-value, .adc code .token.atrule { color: #e6db74; }
        .adc code .token.function, .adc code .token.class-name { color: #a6e22e; }
        .adc code .token.operator, .adc code .token.entity, .adc code .token.url, .adc code .token.punctuation { color: #f8f8f2; }
        .adc code .token.comment, .adc code .token.prolog, .adc code .token.doctype, .adc code .token.cdata { color: #75715e; font-style: italic; }
        .adc code .token.parameter, .adc code .token.variable, .adc code .token.regex, .adc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}

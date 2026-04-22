import { useState, useRef, useEffect, useMemo } from 'react'
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

interface Post {
  id: number
  title: string
  author_id: number
}

interface Author {
  id: number
  name: string
}

const authors: Author[] = [
  { id: 1, name: 'Alice Chen' },
  { id: 2, name: 'Bob Martinez' },
  { id: 3, name: 'Carol Kim' },
]

const posts: Post[] = [
  { id: 1, title: 'Getting Started with Rails', author_id: 1 },
  { id: 2, title: 'Active Record Deep Dive', author_id: 1 },
  { id: 3, title: 'Views and Partials', author_id: 2 },
  { id: 4, title: 'Controller Patterns', author_id: 3 },
  { id: 5, title: 'Testing Strategies', author_id: 2 },
  { id: 6, title: 'Background Jobs', author_id: 3 },
  { id: 7, title: 'API Design', author_id: 1 },
  { id: 8, title: 'Caching in Rails', author_id: 3 },
]

interface QueryLog {
  sql: string
  color: string
  timestamp: number
}

const leftCode = `Post.all.each do |post|
  puts post.author.name
end`
const rightCode = `Post.includes(:author).each do |post|
  puts post.author.name
end`

const leftCodeHtml = Prism.highlight(leftCode, Prism.languages.ruby, 'ruby')
const rightCodeHtml = Prism.highlight(rightCode, Prism.languages.ruby, 'ruby')

export default function N1QueryDemo() {
  const [leftLogs, setLeftLogs] = useState<QueryLog[]>([])
  const [rightLogs, setRightLogs] = useState<QueryLog[]>([])
  const [leftCount, setLeftCount] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  const [running, setRunning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setLeftLogs([])
    setRightLogs([])
    setLeftCount(0)
    setRightCount(0)
    setRunning(false)
  }

  const sched = (fn: () => void, ms: number, side: 'left' | 'right') => {
    timers.current.push(setTimeout(() => {
      fn()
    }, ms))
  }

  const run = () => {
    reset()
    setRunning(true)

    sched(() => {
      setLeftLogs([{ sql: 'SELECT * FROM posts', color: s.yellow, timestamp: Date.now() }])
      setLeftCount(1)
    }, 200, 'left')

    sched(() => {
      setRightLogs([{ sql: 'SELECT * FROM posts', color: s.yellow, timestamp: Date.now() }])
      setRightCount(1)
    }, 200, 'right')

    posts.forEach((post, i) => {
      const delay = 400 + i * 200

      sched(() => {
        setLeftLogs(prev => [...prev, {
          sql: `SELECT * FROM authors WHERE id = ${post.author_id}`,
          color: s.red,
          timestamp: Date.now(),
        }])
        setLeftCount(prev => prev + 1)
      }, delay, 'left')
    })

    sched(() => {
      setRightLogs(prev => [...prev, {
        sql: `SELECT * FROM authors WHERE id IN (1, 2, 3)`,
        color: s.green,
        timestamp: Date.now(),
      }])
      setRightCount(prev => prev + 1)
      setRunning(false)
    }, 500, 'right')
  }

  const panel = (
    title: string,
    codeHtml: string,
    logs: QueryLog[],
    count: number,
    good: boolean
  ) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: good ? s.green : s.red, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <span style={{
          background: good ? `${s.green}20` : `${s.red}20`,
          border: `1px solid ${good ? s.green : s.red}`,
          borderRadius: 10,
          padding: '2px 8px',
          fontSize: 12,
          fontFamily: s.mono,
        }}>
          {count} queries
        </span>
      </div>
      <div style={{
        background: s.bg,
        border: `1px solid ${good ? s.green : s.red}`,
        borderRadius: 8,
        padding: 12,
        fontFamily: s.mono,
        fontSize: 11,
        lineHeight: 1.6,
        whiteSpace: 'pre' as const,
        marginBottom: 8,
      }}>
        <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: 8,
        maxHeight: 200,
        overflowY: 'auto' as const,
        fontFamily: s.mono,
        fontSize: 10,
      }}>
        {logs.length === 0 && <div style={{ color: s.text3, padding: 8, textAlign: 'center' }}>Waiting...</div>}
        {logs.map((log, i) => (
          <div key={i} style={{
            padding: '3px 8px',
            borderLeft: `2px solid ${log.color}`,
            marginBottom: 2,
            color: log.color,
          }}>
            {log.sql}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <DemoBoundary name="N+1 Query Demo">
      <div className="nqc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={run}
            disabled={running}
            style={{
              background: running ? s.bg3 : s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              color: running ? s.text3 : s.bg,
              fontFamily: s.mono,
              fontSize: 12,
              fontWeight: 600,
              cursor: running ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Load Posts
          </button>
          <button
            onClick={reset}
            style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '8px 16px',
              color: s.text3,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {panel(
            'Without includes',
            leftCodeHtml,
            leftLogs,
            leftCount,
            false,
          )}
          {panel(
            'With includes',
            rightCodeHtml,
            rightLogs,
            rightCount,
            true,
          )}
        </div>

        <div style={{
          marginTop: 12,
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          color: s.text2,
          lineHeight: 1.5,
        }}>
          <span style={{ color: s.yellow, fontFamily: s.mono, fontWeight: 600 }}>Without includes:</span> 1 query for posts + N queries for each author = <span style={{ color: s.red, fontFamily: s.mono }}>{posts.length + 1} queries</span>
          {'\n'}
          <span style={{ color: s.yellow, fontFamily: s.mono, fontWeight: 600 }}>With includes:</span> 1 query for posts + 1 query for all authors = <span style={{ color: s.green, fontFamily: s.mono }}>2 queries</span>
        </div>
      </div>
      <style>{`
        .nqc code .token.keyword { color: #f92672; }
        .nqc code .token.string, .nqc code .token.char, .nqc code .token.builtin, .nqc code .token.inserted { color: #e6db74; }
        .nqc code .token.number, .nqc code .token.constant, .nqc code .token.symbol, .nqc code .token.property, .nqc code .token.tag, .nqc code .token.boolean, .nqc code .token.deleted { color: #ae81ff; }
        .nqc code .token.selector, .nqc code .token.attr-name { color: #f92672; }
        .nqc code .token.attr-value, .nqc code .token.atrule { color: #e6db74; }
        .nqc code .token.function, .nqc code .token.class-name { color: #a6e22e; }
        .nqc code .token.operator, .nqc code .token.entity, .nqc code .token.url, .nqc code .token.punctuation { color: #f8f8f2; }
        .nqc code .token.comment, .nqc code .token.prolog, .nqc code .token.doctype, .nqc code .token.cdata { color: #75715e; font-style: italic; }
        .nqc code .token.parameter, .nqc code .token.variable, .nqc code .token.regex, .nqc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}

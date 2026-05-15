import { useState } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface HistoryEntry {
  id: string
  title: string
  progress: number
  duration: number
  lastWatched: string
  imageId: string
}

const initialHistory: HistoryEntry[] = [
  { id: 'h1', title: 'Stranger Things S5 E1', progress: 65, duration: 52, lastWatched: '2 hours ago', imageId: 'stranger' },
  { id: 'h2', title: 'The Witcher S3 E4', progress: 30, duration: 48, lastWatched: 'Yesterday', imageId: 'witcher' },
  { id: 'h3', title: 'Black Mirror S6 E2', progress: 92, duration: 56, lastWatched: '3 days ago', imageId: 'blackmirror' },
  { id: 'h4', title: 'Wednesday S1 E6', progress: 15, duration: 45, lastWatched: '1 week ago', imageId: 'wednesday' },
  { id: 'h5', title: 'Squid Game S1 E5', progress: 78, duration: 55, lastWatched: '1 week ago', imageId: 'squid' },
]

const sessionQueryRow = `SELECT profile_id, video_id, timestamp_ms, progress_ms
FROM watch_sessions
WHERE profile_id = 'p_abc123'
  AND status = 'active'
ORDER BY updated_at DESC
LIMIT 20;`

const sessionQueryHtml = Prism.highlight(sessionQueryRow, Prism.languages.typescript, 'typescript')

const watchSessionSchema = `CREATE TABLE watch_sessions (
  session_id   UUID PRIMARY KEY,
  profile_id   UUID NOT NULL,
  video_id     UUID NOT NULL,
  device_id    TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  progress_ms  INTEGER NOT NULL DEFAULT 0,
  duration_ms  INTEGER NOT NULL,
  status       TEXT CHECK(status IN ('active','paused','completed')),
  bitrate_kbps INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watch_sessions_profile
  ON watch_sessions(profile_id, updated_at DESC);

CREATE INDEX idx_watch_sessions_resume
  ON watch_sessions(profile_id, status)
  WHERE status IN ('active', 'paused');`

const schemaHtml = Prism.highlight(watchSessionSchema, Prism.languages.typescript, 'typescript')

export default function WatchHistoryDemo() {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [showSchema, setShowSchema] = useState(false)

  const removeEntry = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const updateProgress = (id: string) => {
    setHistory(prev => prev.map(h =>
      h.id === id ? { ...h, progress: Math.min(100, h.progress + 10), lastWatched: 'Just now' } : h
    ))
  }

  const colorForProgress = (p: number) => {
    if (p < 30) return s.accent
    if (p < 70) return s.yellow
    if (p < 95) return s.orange
    return s.green
  }

  const sel = history.find(h => h.id === selectedEntry)

  return (
    <DemoBoundary name="Watch History and Resume">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Watch History and Resume Playback</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Continue Watching is populated from watch_sessions. Progress is stored per profile per video as timestamp_ms.
            Click a card to see details. Click the progress bar to advance, or remove to dismiss.
          </p>

          <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>CONTINUE WATCHING</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
            {history.map(h => (
              <div key={h.id} onClick={() => setSelectedEntry(h.id === selectedEntry ? null : h.id)} style={{
                flex: '0 0 180px', background: s.bg, borderRadius: 10, border: `1px solid ${selectedEntry === h.id ? s.accent : s.border}`,
                overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: selectedEntry === h.id ? `0 0 16px ${s.accent}30` : 'none',
              }}>
                <div style={{
                  height: 100, background: `linear-gradient(135deg, ${s.bg3}, ${s.bg2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: `${s.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 0, height: 0, borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent', borderLeft: `10px solid ${s.accent}`,
                      marginLeft: 3,
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: s.bg3,
                  }}>
                    <div style={{
                      height: '100%', width: `${h.progress}%`,
                      background: colorForProgress(h.progress),
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: s.text, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                  <div style={{ fontSize: 9, color: s.text3 }}>{h.progress}% complete</div>
                  <div style={{ fontSize: 9, color: s.text3 }}>{h.lastWatched}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              {sel ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, background: `linear-gradient(135deg, ${s.bg3}, ${s.accent}40)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `12px solid ${s.accent}`, marginLeft: 3 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>{sel.title}</div>
                      <div style={{ fontSize: 11, color: s.text3 }}>Last watched: {sel.lastWatched}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>
                      <span style={{ color: s.text3 }}>Progress</span>
                      <span style={{ color: colorForProgress(sel.progress) }}>{sel.progress}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: s.bg3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${sel.progress}%`,
                        background: colorForProgress(sel.progress), transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginTop: 2 }}>
                      {Math.round(sel.progress * sel.duration / 100)}m / {sel.duration}m
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => updateProgress(sel.id)} style={{
                      padding: '5px 12px', fontSize: 11, borderRadius: 5,
                      background: `${s.accent}20`, border: `1px solid ${s.accent}`, color: s.accent, cursor: 'pointer', fontFamily: s.mono,
                    }}>+10% Progress</button>
                    <button onClick={() => removeEntry(sel.id)} style={{
                      padding: '5px 12px', fontSize: 11, borderRadius: 5,
                      background: `${s.red}20`, border: `1px solid ${s.red}`, color: s.red, cursor: 'pointer', fontFamily: s.mono,
                    }}>Remove</button>
                    <button onClick={() => setSelectedEntry(null)} style={{
                      padding: '5px 12px', fontSize: 11, borderRadius: 5,
                      background: s.bg3, border: `1px solid ${s.border}`, color: s.text3, cursor: 'pointer', fontFamily: s.mono,
                    }}>Close</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: s.text3, fontSize: 12 }}>
                  Click a card to see watch history details and controls
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <button onClick={() => setShowSchema(false)} style={{
                  padding: '4px 12px', fontSize: 10, borderRadius: 4, fontFamily: s.mono,
                  background: !showSchema ? s.accent + '20' : 'transparent',
                  border: `1px solid ${!showSchema ? s.accent : s.border}`,
                  color: !showSchema ? s.accent : s.text3, cursor: 'pointer',
                }}>Query</button>
                <button onClick={() => setShowSchema(true)} style={{
                  padding: '4px 12px', fontSize: 10, borderRadius: 4, fontFamily: s.mono,
                  background: showSchema ? s.accent + '20' : 'transparent',
                  border: `1px solid ${showSchema ? s.accent : s.border}`,
                  color: showSchema ? s.accent : s.text3, cursor: 'pointer',
                }}>Schema</button>
              </div>
              <div style={{
                background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`,
                maxHeight: 240, overflow: 'auto',
              }}>
                <style>{`
                  code .token.keyword { color: #f92672; } code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; } code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; } code .token.selector, code .token.attr-name { color: #f92672; } code .token.attr-value, code .token.atrule { color: #e6db74; } code .token.function, code .token.class-name { color: #a6e22e; } code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; } code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; } code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
                `}</style>
                <code style={{ fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre' }}
                  dangerouslySetInnerHTML={{ __html: showSchema ? schemaHtml : sessionQueryHtml }} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 12, fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: s.text2 }}>Key design decisions:</span> Watch sessions use DynamoDB/Cassandra keyed by (profile_id, updated_at). Progress is stored as milliseconds from start. The "Continue Watching" row queries for active/paused sessions, filters out completed ones (&gt;95%), and sorts by recency. Each session stores device_id so you can resume on the same device without re-authentication.
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

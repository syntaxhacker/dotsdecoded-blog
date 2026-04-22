import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Strategy = 'none' | 'fragment' | 'russian_doll'

interface CacheEntry {
  key: string
  label: string
  depth: number
  hits: number
  misses: number
  lastResult: 'hit' | 'miss' | null
}

const BASE_RENDER_TIME = 120
const CACHE_HIT_TIME = 5

export default function CachingStrategyDemo() {
  const [strategy, setStrategy] = useState<Strategy>('none')
  const [requestCount, setRequestCount] = useState(0)
  const [logs, setLogs] = useState<{ text: string; color: string; time: number }[]>([])
  const [animating, setAnimating] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [cache, setCache] = useState<CacheEntry[]>([])
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState('')

  const buildCache = useCallback(() => {
    if (strategy === 'none') return []
    if (strategy === 'fragment') {
      return [
        { key: 'post-42', label: 'Post #42', depth: 0, hits: 0, misses: 0, lastResult: null },
      ]
    }
    return [
      { key: 'post-42', label: 'Post #42 (outer)', depth: 0, hits: 0, misses: 0, lastResult: null },
      { key: 'comment-1', label: 'Comment #1', depth: 1, hits: 0, misses: 0, lastResult: null },
      { key: 'comment-2', label: 'Comment #2', depth: 1, hits: 0, misses: 0, lastResult: null },
      { key: 'comment-3', label: 'Comment #3', depth: 1, hits: 0, misses: 0, lastResult: null },
    ]
  }, [strategy])

  const makeRequest = useCallback(() => {
    if (animating) return
    setAnimating(true)
    setRequestCount(prev => prev + 1)
    setTotalTime(0)
    setProgress(0)
    setCache(buildCache())
    setLogs([])
  }, [animating, buildCache])

  useEffect(() => {
    if (!animating) return

    const isCached = requestCount > 1 && strategy !== 'none'
    const phases: { text: string; color: string; duration: number }[] = []

    if (strategy === 'none') {
      phases.push(
        { text: 'Querying Post #42 from database...', color: s.accent, duration: BASE_RENDER_TIME },
        { text: 'Rendering post template (40ms)', color: s.orange, duration: 40 },
        { text: 'Querying comments from database...', color: s.accent, duration: 80 },
        { text: 'Rendering 3 comments (60ms)', color: s.orange, duration: 60 },
      )
    } else if (strategy === 'fragment') {
      if (!isCached) {
        phases.push(
          { text: 'Querying Post #42 from database...', color: s.accent, duration: BASE_RENDER_TIME },
          { text: 'Rendering post template (40ms)', color: s.orange, duration: 40 },
          { text: 'Querying comments from database...', color: s.accent, duration: 80 },
          { text: 'Rendering 3 comments (60ms)', color: s.orange, duration: 60 },
          { text: 'CACHE MISS: post-42 -> stored in cache', color: s.yellow, duration: 10 },
        )
      } else {
        phases.push(
          { text: 'CACHE HIT: post-42 -> reading from cache', color: s.green, duration: CACHE_HIT_TIME },
        )
      }
    } else {
      if (!isCached) {
        phases.push(
          { text: 'Querying Post #42 from database...', color: s.accent, duration: BASE_RENDER_TIME },
          { text: 'Rendering outer post template (40ms)', color: s.orange, duration: 40 },
          { text: 'CACHE MISS: post-42 -> stored in cache', color: s.yellow, duration: 10 },
          { text: 'Querying comments from database...', color: s.accent, duration: 80 },
          { text: 'CACHE MISS: comment-1 -> stored', color: s.yellow, duration: 10 },
          { text: 'CACHE MISS: comment-2 -> stored', color: s.yellow, duration: 10 },
          { text: 'CACHE MISS: comment-3 -> stored', color: s.yellow, duration: 10 },
        )
      } else {
        phases.push(
          { text: 'CACHE HIT: post-42 -> outer shell from cache', color: s.green, duration: CACHE_HIT_TIME },
          { text: 'CACHE HIT: comment-1 -> from cache', color: s.green, duration: CACHE_HIT_TIME },
          { text: 'CACHE HIT: comment-2 -> from cache', color: s.green, duration: CACHE_HIT_TIME },
          { text: 'CACHE HIT: comment-3 -> from cache', color: s.green, duration: CACHE_HIT_TIME },
        )
      }
    }

    let phaseIdx = 0
    let elapsed = 0

    const advance = () => {
      if (phaseIdx >= phases.length) {
        setAnimating(false)
        setCurrentPhase('')
        return
      }

      const phase = phases[phaseIdx]
      setCurrentPhase(phase.text)
      setLogs(prev => [...prev, { text: phase.text, color: phase.color, time: elapsed }])

      const step = 20
      const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0)

      const interval = setInterval(() => {
        elapsed += step
        setTotalTime(elapsed)
        setProgress(Math.min((elapsed / totalDuration) * 100, 100))

        if (elapsed >= phase.duration * (phaseIdx + 1) + phases.slice(0, phaseIdx).reduce((sum, p) => sum + p.duration, 0) - phases.slice(0, phaseIdx).reduce((sum, p) => sum + p.duration, 0) + (phase.duration - (elapsed - phases.slice(0, phaseIdx).reduce((sum, p) => sum + p.duration, 0)))) {
          clearInterval(interval)
        }

        if (elapsed - phases.slice(0, phaseIdx).reduce((sum, p) => sum + p.duration, 0) >= phase.duration) {
          clearInterval(interval)
          phaseIdx++
          advance()
        }
      }, step)
    }

    advance()
  }, [animating, requestCount, strategy])

  useEffect(() => {
    if (!animating || cache.length === 0) return
    const isCached = requestCount > 1 && strategy !== 'none'

    if (strategy === 'fragment') {
      setCache(prev => prev.map(c => ({
        ...c,
        lastResult: isCached ? 'hit' : 'miss',
        hits: isCached ? c.hits + 1 : c.hits,
        misses: isCached ? c.misses : c.misses + 1,
      })))
    } else if (strategy === 'russian_doll') {
      setCache(prev => prev.map(c => ({
        ...c,
        lastResult: isCached ? 'hit' : 'miss',
        hits: isCached ? c.hits + 1 : c.hits,
        misses: isCached ? c.misses : c.misses + 1,
      })))
    }
  }, [animating, requestCount, strategy, cache.length])

  const strategyLabel = strategy === 'none' ? 'No Cache' : strategy === 'fragment' ? 'Fragment Cache' : 'Russian Doll Cache'
  const strategyDesc = strategy === 'none'
    ? 'Every request renders everything from scratch'
    : strategy === 'fragment'
    ? 'Rendered fragments are stored and reused'
    : 'Nested fragments with independent cache keys'

  return (
    <DemoBoundary name="Caching Strategies">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            {(['none', 'fragment', 'russian_doll'] as Strategy[]).map(st => (
              <button
                key={st}
                onClick={() => { setStrategy(st); setRequestCount(0); setLogs([]); setCache([]); setTotalTime(0); }}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: strategy === st ? s.accent : 'transparent',
                  color: strategy === st ? '#fff' : s.text3,
                  transition: 'all 0.2s',
                }}
              >
                {st === 'none' ? 'No Cache' : st === 'fragment' ? 'Fragment' : 'Russian Doll'}
              </button>
            ))}
            <span style={{ marginLeft: 8, fontSize: 12, color: s.text3, fontFamily: s.mono }}>{strategyDesc}</span>
            <button
              onClick={makeRequest}
              disabled={animating}
              style={{
                marginLeft: 'auto',
                padding: '6px 14px',
                fontSize: 13,
                fontFamily: s.mono,
                border: `1px solid ${s.accent}`,
                borderRadius: 6,
                cursor: animating ? 'not-allowed' : 'pointer',
                background: animating ? s.bg3 : 'rgba(91,141,239,0.15)',
                color: animating ? s.text3 : s.accent,
                transition: 'all 0.2s',
              }}
            >
              Request Page
            </button>
          </div>

          {currentPhase && (
            <div style={{
              padding: '10px 16px',
              background: currentPhase.includes('HIT') ? 'rgba(61,214,140,0.08)' : currentPhase.includes('MISS') ? 'rgba(224,176,64,0.08)' : 'rgba(91,141,239,0.08)',
              borderBottom: `1px solid ${s.border}`,
              fontSize: 13,
              fontFamily: s.mono,
              color: currentPhase.includes('HIT') ? s.green : currentPhase.includes('MISS') ? s.yellow : s.accent,
            }}>
              {currentPhase}
            </div>
          )}

          <div style={{ display: 'flex', minHeight: 200 }}>
            <div style={{ flex: 1, padding: 16, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>REQUEST LOG</div>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {logs.length === 0 && (
                  <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>Click "Request Page" to start</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    fontFamily: s.mono,
                    color: log.color,
                    padding: '3px 0',
                    opacity: i === logs.length - 1 ? 1 : 0.6,
                  }}>
                    <span style={{ color: s.text3, marginRight: 8 }}>{log.time}ms</span>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: 220, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>CACHE STATE</div>
              {cache.length === 0 && (
                <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>No cache entries</div>
              )}
              {cache.map((entry, i) => (
                <div key={entry.key} style={{
                  marginLeft: entry.depth * 12,
                  padding: '4px 8px',
                  marginBottom: 4,
                  borderRadius: 4,
                  background: entry.lastResult === 'hit' ? 'rgba(61,214,140,0.1)' : entry.lastResult === 'miss' ? 'rgba(224,176,64,0.1)' : s.bg,
                  border: `1px solid ${entry.lastResult === 'hit' ? s.green : entry.lastResult === 'miss' ? s.yellow : s.border}`,
                  fontSize: 12,
                  fontFamily: s.mono,
                  color: entry.lastResult === 'hit' ? s.green : entry.lastResult === 'miss' ? s.yellow : s.text2,
                  transition: 'all 0.3s',
                }}>
                  {entry.label}
                  <span style={{ marginLeft: 8, fontSize: 11, color: s.text3 }}>
                    H:{entry.hits} M:{entry.misses}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 16px',
            borderTop: `1px solid ${s.border}`,
            fontSize: 12,
            fontFamily: s.mono,
            color: s.text3,
          }}>
            <span>Requests: <span style={{ color: s.text2 }}>{requestCount}</span></span>
            <span>Time: <span style={{ color: requestCount > 1 && strategy !== 'none' ? s.green : s.accent }}>{totalTime}ms</span></span>
            <div style={{ flex: 1, height: 4, background: s.bg, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: currentPhase.includes('HIT') ? s.green : s.accent,
                borderRadius: 2,
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

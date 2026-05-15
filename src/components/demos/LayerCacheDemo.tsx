import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface DockerLine {
  num: number
  instruction: string
  content: string
  volatility: 'stable' | 'medium' | 'volatile'
}

const dockerfile: DockerLine[] = [
  { num: 1, instruction: 'FROM', content: 'python:3.12-slim AS builder', volatility: 'stable' },
  { num: 2, instruction: 'RUN', content: 'apt-get update && apt-get install -y build-essential', volatility: 'stable' },
  { num: 3, instruction: 'COPY', content: 'requirements.txt /app/', volatility: 'medium' },
  { num: 4, instruction: 'RUN', content: 'pip install -r requirements.txt', volatility: 'medium' },
  { num: 5, instruction: 'COPY', content: '. /app/', volatility: 'volatile' },
  { num: 6, instruction: 'CMD', content: '["python", "app.py"]', volatility: 'stable' },
]

export default function LayerCacheDemo() {
  const [modifiedLine, setModifiedLine] = useState<number | null>(null)
  const [prevModifiedLine, setPrevModifiedLine] = useState<number | null>(null)

  const cacheState = useMemo(() => {
    const lines: { num: number; instruction: string; content: string; cached: boolean; miss: boolean; reason: string }[] = []

    if (modifiedLine === null) {
      dockerfile.forEach(l => {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: true, miss: false, reason: 'Cached (unchanged)',
        })
      })
      return lines
    }

    const modIdx = dockerfile.findIndex(l => l.num === modifiedLine)

    dockerfile.forEach((l, i) => {
      if (i < modIdx) {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: true, miss: false, reason: 'Cached (above modified line)',
        })
      } else if (i === modIdx) {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: false, miss: true, reason: 'MODIFIED - cache invalidated',
        })
      } else {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: false, miss: true, reason: 'Cache invalidated by change above',
        })
      }
    })

    return lines
  }, [modifiedLine])

  const prevCacheState = useMemo(() => {
    if (prevModifiedLine === null) return null
    const lines: { num: number; instruction: string; content: string; cached: boolean; miss: boolean; reason: string }[] = []

    const modIdx = dockerfile.findIndex(l => l.num === prevModifiedLine)

    dockerfile.forEach((l, i) => {
      if (i < modIdx) {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: true, miss: false, reason: 'Cached (above modified line)',
        })
      } else if (i === modIdx) {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: false, miss: true, reason: 'MODIFIED - cache invalidated',
        })
      } else {
        lines.push({
          num: l.num, instruction: l.instruction, content: l.content,
          cached: false, miss: true, reason: 'Cache invalidated by change above',
        })
      }
    })

    return lines
  }, [prevModifiedLine])

  const modifyLine = (lineNum: number) => {
    setPrevModifiedLine(modifiedLine)
    setModifiedLine(lineNum)
  }

  const reset = () => {
    setModifiedLine(null)
    setPrevModifiedLine(null)
  }

  const totalLayers = dockerfile.length
  const cachedLayers = cacheState.filter(l => l.cached).length
  const rebuiltLayers = cacheState.filter(l => l.miss).length

  return (
    <DemoBoundary name="Layer Cache">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Docker Layer Cache Mechanics</div>

        <div style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Each Dockerfile instruction creates a layer. Docker caches layers from previous builds.
          When a layer changes, ALL subsequent layers must be rebuilt. Layer ordering matters.
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Dockerfile</div>
            {dockerfile.map((l, i) => {
              const st = cacheState.find(cs => cs.num === l.num)!
              const prevSt = prevCacheState?.find(cs => cs.num === l.num)
              const isChanged = prevSt && !prevSt.cached
              return (
                <div key={l.num} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                  padding: '6px 10px', borderRadius: 6, transition: 'all 0.3s',
                  background: st.miss ? `${s.red}10` : `${s.green}08`,
                  border: `1px solid ${st.miss ? s.red : s.green}`,
                  opacity: st.cached ? 1 : isChanged ? 0.6 : 1,
                }}>
                  <div style={{
                    width: 20, fontSize: 10, color: s.text3, fontFamily: s.mono, textAlign: 'right',
                  }}>{l.num}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, fontFamily: s.mono, minWidth: 42,
                    color: l.instruction === 'COPY' ? s.accent :
                           l.instruction === 'RUN' ? s.green :
                           l.instruction === 'FROM' ? s.purple : s.yellow,
                  }}>{l.instruction}</div>
                  <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.content}
                  </div>
                  {st.miss && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: s.red, flexShrink: 0,
                    }} />
                  )}
                  {st.cached && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: s.green, flexShrink: 0,
                    }} />
                  )}
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => modifyLine(3)} style={btnStyle}>Modify Line 3 (COPY req...)</button>
              <button onClick={() => modifyLine(1)} style={btnStyle}>Modify Line 1 (FROM)</button>
              <button onClick={reset} style={{ ...btnStyle, background: s.bg3, border: `1px solid ${s.border}`, color: s.text2 }}>Reset Cache</button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Layer Cache Stack</div>

            <div style={{ position: 'relative', padding: '8px 0' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 20, width: 2,
                background: s.border2, zIndex: 0,
              }} />
              {[...cacheState].reverse().map((st, reversedI) => {
                const actualI = cacheState.length - 1 - reversedI
                return (
                  <div key={st.num} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', position: 'relative', zIndex: 1,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: st.cached ? `${s.green}20` : `${s.red}20`,
                      border: `2px solid ${st.cached ? s.green : s.red}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontFamily: s.mono, fontWeight: 700, color: st.cached ? s.green : s.red,
                      position: 'relative', zIndex: 2, backgroundImage: st.cached ? 'none' : `repeating-linear-gradient(45deg, transparent, transparent 3px, ${s.red}15 3px, ${s.red}15 6px)`,
                    }}>
                      {st.num}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: st.cached ? s.green : s.red, fontFamily: s.mono }}>
                        {st.instruction} {st.content.length > 20 ? st.content.slice(0, 20) + '...' : st.content}
                      </div>
                      <div style={{ fontSize: 10, color: st.cached ? s.green : s.red }}>
                        {st.cached ? 'CACHE HIT' : 'CACHE MISS'} - {st.reason}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{
              display: 'flex', gap: 16, padding: '10px 12px', background: s.bg,
              border: `1px solid ${s.border}`, borderRadius: 8, marginTop: 8, fontSize: 11, fontFamily: s.mono,
            }}>
              <span style={{ color: s.green }}>{cachedLayers} cached</span>
              <span style={{ color: s.red }}>{rebuiltLayers} rebuilt</span>
              <span style={{ color: s.text3 }}>{totalLayers} total layers</span>
            </div>

            <div style={{ marginTop: 16, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Best Practice: Layer Ordering</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
                Put stable instructions first (FROM, system deps) and volatile instructions last (COPY source code).
                This maximizes cache reuse -- your app code changes won't force rebuilding pip packages.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${s.green}20`, color: s.green, fontFamily: s.mono }}>Stable first</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${s.yellow}20`, color: s.yellow, fontFamily: s.mono }}>Medium</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${s.red}20`, color: s.red, fontFamily: s.mono }}>Volatile last</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

const btnStyle: React.CSSProperties = {
  background: s.accent, border: 'none', borderRadius: 6,
  padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600,
  fontFamily: s.mono, transition: 'all 0.15s',
}

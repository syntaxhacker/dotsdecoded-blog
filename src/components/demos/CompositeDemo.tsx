import { useState, useCallback, useEffect, useRef } from 'react'
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

interface LayerConfig {
  id: string
  label: string
  reason: string
  x: number
  y: number
  w: number
  h: number
  color: string
  prop: string
}

const layers: LayerConfig[] = [
  { id: 'layer-bg', label: 'Page Background', reason: 'Default', x: 0, y: 0, w: 100, h: 100, color: s.accent, prop: 'body' },
  { id: 'layer-fixed', label: 'Fixed Header', reason: 'position: fixed', x: 0, y: 0, w: 100, h: 12, color: s.green, prop: 'position: fixed' },
  { id: 'layer-translate', label: 'Animated Card', reason: 'will-change: transform', x: 20, y: 30, w: 60, h: 40, color: s.yellow, prop: 'will-change: transform' },
  { id: 'layer-video', label: 'Video Element', reason: '<video>', x: 10, y: 55, w: 35, h: 30, color: s.purple, prop: '<video> / <canvas>' },
  { id: 'layer-content', label: 'Content Area', reason: 'Default (no promotion)', x: 50, y: 75, w: 45, h: 20, color: s.text3, prop: 'none (composited)' },
]

export default function CompositeDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    'layer-bg': true,
    'layer-fixed': true,
    'layer-translate': true,
    'layer-video': true,
    'layer-content': false,
  })
  const [animate, setAnimate] = useState(false)
  const [animPos, setAnimPos] = useState(0)
  const [highlightLayer, setHighlightLayer] = useState<string | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!animate) {
      setAnimPos(0)
      return
    }
    let start = performance.now()
    const tick = (now: number) => {
      const elapsed = ((now - start) / 3000) * 100
      setAnimPos(elapsed > 100 ? 100 : elapsed)
      if (elapsed < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setAnimate(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  const toggleLayer = useCallback((id: string) => {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const highlightOnly = useCallback((id: string) => {
    setHighlightLayer(prev => prev === id ? null : id)
  }, [])

  return (
    <DemoBoundary name="Compositing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Compositing Layers</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Certain properties promote elements to their own compositing layer.
          Layers are painted independently and then composited together by the GPU.
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, perspective: 800 }}>
            <div style={{
              position: 'relative', height: 360,
              background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`,
              overflow: 'hidden',
              transformStyle: 'preserve-3d',
              transform: 'rotateX(4deg) rotateY(-2deg)',
              transition: 'transform 0.3s',
            }}>
              {layers.map(layer => {
                if (!enabled[layer.id]) return null
                const isHighlighted = highlightLayer === layer.id || highlightLayer === null
                return (
                  <div
                    key={layer.id}
                    onClick={() => highlightOnly(layer.id)}
                    style={{
                      position: 'absolute',
                      left: `${layer.x}%`, top: `${layer.y}%`,
                      width: `${layer.w}%`, height: `${layer.h}%`,
                      background: `${layer.color}25`,
                      border: `2px solid ${isHighlighted ? layer.color : s.border}`,
                      borderRadius: 8,
                      transformStyle: 'preserve-3d',
                      transform: `translateZ(${enabled[layer.id] ? 10 : 0}px)`,
                      transition: 'all 0.3s ease',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: isHighlighted ? 1 : 0.4,
                    }}
                  >
                    <span style={{ color: layer.color, fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }}>
                      {layer.label}
                    </span>
                    <span style={{
                      color: s.text3, fontSize: 9, marginTop: 4,
                      background: `${s.bg}88`,
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {enabled[layer.id] ? 'GPU' : 'CPU'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ width: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Layer Properties</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {layers.map(layer => (
                <div key={layer.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                  background: enabled[layer.id] ? `${layer.color}10` : 'transparent',
                  border: `1px solid ${enabled[layer.id] ? layer.color : s.border}`,
                  transition: 'all 0.2s',
                }}
                  onClick={() => toggleLayer(layer.id)}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: enabled[layer.id] ? layer.color : 'transparent',
                    border: `1px solid ${enabled[layer.id] ? layer.color : s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: enabled[layer.id] ? '#000' : 'transparent',
                    fontWeight: 700, transition: 'all 0.15s',
                  }}>
                    {enabled[layer.id] ? 'x' : ''}
                  </div>
                  <span style={{ color: enabled[layer.id] ? s.text : s.text3, fontSize: 11, lineHeight: 1.3 }}>
                    {layer.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setAnimate(true)} disabled={animate} style={{
            background: animate ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: animate ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: animate ? 0.5 : 1,
          }}>Animate Layer</button>
          <div style={{ flex: 1, height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${animPos}%`, height: '100%',
              background: s.accent, borderRadius: 3, transition: 'width 0.05s linear',
            }} />
          </div>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{Math.round(animPos)}%</span>
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Compositing Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div style={{ color: s.text2 }}>
              Active layers: <span style={{ color: s.text, fontFamily: s.mono }}>{Object.values(enabled).filter(Boolean).length}</span>
            </div>
            <div style={{ color: s.text2 }}>
              GPU composited: <span style={{ color: s.green, fontFamily: s.mono }}>{Object.values(enabled).filter(Boolean).length - 1}</span>
            </div>
            <div style={{ color: s.text2 }}>
              Click a layer to isolate it
            </div>
            <div style={{ color: animPos >= 100 ? s.green : s.text2 }}>
              {animPos >= 100 ? 'Animation complete - only animated layer repainted' : 'Idle'}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

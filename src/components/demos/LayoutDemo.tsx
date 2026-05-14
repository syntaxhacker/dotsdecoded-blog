import { useState, useMemo, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 12, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface LayoutRect {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  color: string
  borderColor: string
  margin: { top: number; right: number; bottom: number; left: number }
  padding: { top: number; right: number; bottom: number; left: number }
}

function computeLayout(viewportWidth: number): { rects: LayoutRect[]; shifted: string[] } {
  const isNarrow = viewportWidth < 500
  const contentPad = 16
  const headerH = 48
  const footerH = 36
  const sidebarW = isNarrow ? viewportWidth - contentPad * 2 : 160
  const sidebarH = isNarrow ? 100 : 260
  const mainH = isNarrow ? 180 : 260

  const x0 = contentPad
  const y0 = contentPad

  const rects: LayoutRect[] = [
    {
      id: 'header',
      label: 'Header',
      x: x0, y: y0,
      w: Math.max(viewportWidth - contentPad * 2, 0),
      h: headerH,
      color: '#1a2332',
      borderColor: s.accent,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
    },
    {
      id: 'sidebar',
      label: 'Sidebar',
      x: isNarrow ? x0 : x0,
      y: isNarrow ? y0 + headerH + 8 : y0 + headerH + 8,
      w: isNarrow ? Math.max(viewportWidth - contentPad * 2, 0) : sidebarW,
      h: sidebarH,
      color: '#1e1a2e',
      borderColor: s.purple,
      margin: { top: 0, right: isNarrow ? 0 : 8, bottom: 0, left: 0 },
      padding: { top: 10, right: 12, bottom: 10, left: 12 },
    },
    {
      id: 'main',
      label: 'Main Content',
      x: isNarrow ? x0 : x0 + sidebarW + 8,
      y: isNarrow ? y0 + headerH + 8 + sidebarH + 8 : y0 + headerH + 8,
      w: isNarrow ? Math.max(viewportWidth - contentPad * 2, 0) : Math.max(viewportWidth - contentPad * 2 - sidebarW - 8, 0),
      h: isNarrow ? mainH : Math.max(sidebarH, mainH),
      color: '#1a2628',
      borderColor: s.green,
      margin: { top: 0, right: 0, bottom: 0, left: isNarrow ? 0 : 8 },
      padding: { top: 10, right: 16, bottom: 10, left: 16 },
    },
    {
      id: 'footer',
      label: 'Footer',
      x: x0,
      y: y0 + headerH + 8 + Math.max(isNarrow ? sidebarH + 8 + mainH : 0, isNarrow ? 0 : sidebarH + 8) + 8,
      w: Math.max(viewportWidth - contentPad * 2, 0),
      h: footerH,
      color: '#1a1a1e',
      borderColor: s.orange,
      margin: { top: 8, right: 0, bottom: 0, left: 0 },
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
    },
  ]

  const prevSidebarW = 160
  const prevMainX = x0 + prevSidebarW + 8
  const shifted = !isNarrow ? rects.filter((r) => {
    if (r.id === 'sidebar') return false
    if (r.id === 'main') return Math.abs(r.x - prevMainX) > 1
    return false
  }).map(r => r.id) : rects.filter(r => r.id !== 'header' && r.id !== 'footer').map(r => r.id)

  return { rects, shifted }
}

function BoxModelDisplay({ rect, isShifted }: { rect: LayoutRect; isShifted: boolean }) {
  if (!rect || rect.w < 10) return null
  const totalW = rect.w + rect.margin.left + rect.margin.right
  const totalH = rect.h + rect.margin.top + rect.margin.bottom
  const padTop = Math.min(rect.padding.top, rect.h * 0.3)
  const padBottom = Math.min(rect.padding.bottom, rect.h * 0.3)
  const padLeft = Math.min(rect.padding.left, rect.w * 0.3)
  const padRight = Math.min(rect.padding.right, rect.w * 0.3)
  const contentW = Math.max(rect.w - padLeft - padRight, 2)
  const contentH = Math.max(rect.h - padTop - padBottom, 2)

  return (
    <div style={{ fontSize: 10, fontFamily: s.mono, lineHeight: 1.3 }}>
      <div style={{ color: s.text3, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, color: isShifted ? s.yellow : s.text }}>{rect.label}</span>
        {isShifted && <span style={{ color: s.yellow, fontSize: 9, padding: '1px 5px', background: 'rgba(224,176,64,.12)', borderRadius: 3 }}>shifted</span>}
      </div>
      <div style={{
        position: 'relative', width: Math.min(totalW, 160), height: Math.min(totalH, 60), marginBottom: 4,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(232,93,93,.08)', border: '1px dashed rgba(232,93,93,.3)',
          borderRadius: 2,
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'rgba(232,93,93,.5)', fontSize: 8,
          }}>margin</div>
        </div>
        <div style={{
          position: 'absolute', top: `${(rect.margin.top / totalH) * 100}%`,
          left: `${(rect.margin.left / totalW) * 100}%`,
          width: `${(rect.w / totalW) * 100}%`, height: `${(rect.h / totalH) * 100}%`,
          background: 'rgba(91,141,239,.1)', border: '1px dashed rgba(91,141,239,.4)',
          borderRadius: 2,
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(91,141,239,.5)', fontSize: 7 }}>
            border
          </div>
          <div style={{
            position: 'absolute', top: `${(padTop / rect.h) * 100}%`,
            left: `${(padLeft / rect.w) * 100}%`,
            width: `${(contentW / rect.w) * 100}%`, height: `${(contentH / rect.h) * 100}%`,
            background: 'rgba(61,214,140,.08)', border: '1px dashed rgba(61,214,140,.3)',
            borderRadius: 2,
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(61,214,140,.5)', fontSize: 7 }}>
              content
            </div>
          </div>
        </div>
      </div>
      <div style={{ color: s.text3, fontSize: 9, lineHeight: 1.5 }}>
        x: {rect.x} y: {rect.y} w: {rect.w} h: {rect.h}
      </div>
      <div style={{ color: 'rgba(232,93,93,.6)', fontSize: 9 }}>
        margin: {rect.margin.top},{rect.margin.right},{rect.margin.bottom},{rect.margin.left}
      </div>
      <div style={{ color: 'rgba(91,141,239,.6)', fontSize: 9 }}>
        padding: {rect.padding.top},{rect.padding.right},{rect.padding.bottom},{rect.padding.left}
      </div>
    </div>
  )
}

export default function LayoutDemo() {
  const [viewportWidth, setViewportWidth] = useState(740)
  const [layoutCount, setLayoutCount] = useState(0)
  const [lastTriggered, setLastTriggered] = useState<number | null>(null)

  const rects = useMemo(() => computeLayout(viewportWidth), [viewportWidth])
  const shifted = rects.shifted

  const layoutHeight = useMemo(() => {
    const maxY = Math.max(...rects.rects.map(r => r.y + r.h + r.margin.top + r.margin.bottom))
    return maxY + 16
  }, [rects])

  useEffect(() => {
    setLayoutCount(prev => prev + 1)
    setLastTriggered(Date.now())
    const t = setTimeout(() => setLastTriggered(null), 2500)
    return () => clearTimeout(t)
  }, [viewportWidth])

  return (
    <DemoBoundary name="Layout (Reflow)">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={SEC}>
        <div style={H}>Layout (Reflow)</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          The browser calculates geometric positions for every render tree node.
          Drag the slider to change viewport width and watch the layout recalculate.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
              Viewport Width: <span style={{ color: s.accent, fontFamily: s.mono, fontWeight: 600 }}>{viewportWidth}px</span>
            </label>
            <input type="range" min={320} max={820} value={viewportWidth}
              onChange={e => setViewportWidth(Number(e.target.value))}
              style={{ width: '100%', accentColor: s.accent }} />
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 6,
            background: lastTriggered && Date.now() - lastTriggered < 2000 ? 'rgba(224,176,64,.12)' : s.bg3,
            border: `1px solid ${lastTriggered && Date.now() - lastTriggered < 2000 ? s.yellow : s.border}`,
            transition: 'all .3s',
            fontSize: 11, fontFamily: s.mono, color: s.text2,
          }}>
            {lastTriggered && Date.now() - lastTriggered < 2000 ? (
              <span style={{ color: s.yellow }}>Layout triggered</span>
            ) : 'Layout stable'}
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 6,
            background: s.bg3, border: `1px solid ${s.border}`,
            fontSize: 11, fontFamily: s.mono, color: s.text2,
          }}>
            Reflows: <span style={{ color: s.accent, fontWeight: 600 }}>{layoutCount}</span>
          </div>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: 8, marginBottom: 16, overflow: 'auto',
        }}>
          <svg width={viewportWidth} height={Math.min(layoutHeight, 500)}
            style={{ display: 'block', minHeight: 200 }}>
            {rects.rects.map(r => (
              <g key={r.id}>
                <rect
                  x={r.x} y={r.y} width={r.w} height={r.h}
                  fill={r.color} stroke={shifted.includes(r.id) ? s.yellow : r.borderColor}
                  strokeWidth={shifted.includes(r.id) ? 2.5 : 1.5}
                  rx={4} ry={4}
                  style={{ transition: 'all .25s ease' }}
                />
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fill={shifted.includes(r.id) ? s.yellow : s.text2}
                  fontSize={11} fontWeight={600}
                  fontFamily="'SF Mono', Consolas, monospace"
                  style={{ transition: 'all .25s ease' }}
                >
                  {r.label}
                </text>
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 + 14}
                  textAnchor="middle" dominantBaseline="central"
                  fill={s.text3}
                  fontSize={9}
                  fontFamily="'SF Mono', Consolas, monospace"
                  style={{ transition: 'all .25s ease' }}
                >
                  {r.w}x{r.h}
                </text>
                {shifted.includes(r.id) && (
                  <text
                    x={r.x + r.w + 6} y={r.y + r.h / 2}
                    textAnchor="start" dominantBaseline="central"
                    fill={s.yellow}
                    fontSize={9}
                    fontFamily="'SF Mono', Consolas, monospace"
                    style={{ transition: 'all .25s ease' }}
                  >
                    {'\u2194'} shifted
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div style={{
          padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
          fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>Box Model Details</div>
        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
          padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12,
        }}>
          {rects.rects.map(r => (
            <BoxModelDisplay key={r.id} rect={r} isShifted={shifted.includes(r.id)} />
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

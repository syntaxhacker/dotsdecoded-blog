import { useState, useEffect } from 'react'
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

const stages = [
  { label: 'HTML', sub: 'Parse HTML', desc: 'Browser receives raw HTML and begins parsing it into a tree of nodes called the DOM (Document Object Model). Each tag becomes an element node, text becomes text nodes.' },
  { label: 'DOM', sub: 'Build DOM Tree', desc: 'The DOM tree represents the page structure. Elements are nested, attributes are recorded, and the tree reflects the document hierarchy exactly as written in HTML.' },
  { label: 'CSS', sub: 'Parse CSS', desc: 'All CSS (external files, <style> tags, inline styles) is parsed into the CSSOM (CSS Object Model). Property values are resolved, selectors are matched to elements.' },
  { label: 'CSSOM', sub: 'Build CSSOM', desc: 'The CSSOM is a tree of styles. Cascade, specificity, and inheritance are all resolved here. Each DOM node gets its final computed style from the CSSOM.' },
  { label: 'Render', sub: 'Render Tree', desc: 'The DOM and CSSOM merge into the Render Tree. Only visible elements are included — <head>, <script>, and display:none elements are excluded.' },
  { label: 'Layout', sub: 'Calculate Geometry', desc: 'The browser calculates the exact position (x, y) and size (width, height) of every element in the render tree. This is also called "reflow".' },
  { label: 'Paint', sub: 'Fill Pixels', desc: 'The browser fills in pixels for each element — text, colors, images, borders, shadows. Elements may be painted into multiple layers.' },
  { label: 'Composite', sub: 'Combine Layers', desc: 'Painted layers are composited together in the correct order. Transform and opacity changes only trigger this stage — the cheapest update.' },
]

function RenderPipelineDemo() {
  const [active, setActive] = useState(-1)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    setActive(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    stages.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActive(i)
        if (i === stages.length - 1) {
          setTimeout(() => setRunning(false), 800)
        }
      }, i * 700))
    })
    return () => timers.forEach(clearTimeout)
  }, [running])

  const handleClick = (i: number) => setActive(i)

  return (
    <DemoBoundary name="Render Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => setRunning(true)}
            disabled={running}
            style={{
              background: running ? s.bg3 : s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              color: s.text,
              fontFamily: s.mono,
              fontSize: 13,
              cursor: running ? 'default' : 'pointer',
              opacity: running ? 0.6 : 1,
            }}
          >
            Run Pipeline
          </button>
          <span style={{ color: s.text3, fontSize: 13 }}>Click stages or run the full pipeline</span>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 24 }}>
          {stages.map((st, i) => (
            <div key={st.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <button
                onClick={() => handleClick(i)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 4px',
                  background: i === active ? s.accent : i < active ? s.green + '22' : s.bg2,
                  border: `1px solid ${i === active ? s.accent : i < active ? s.green : s.border}`,
                  borderRadius: 6,
                  color: i === active ? s.text : s.text2,
                  fontFamily: s.mono,
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontWeight: 600 }}>{st.label}</div>
                <div style={{ fontSize: 9, color: s.text3, marginTop: 2 }}>{st.sub}</div>
              </button>
              {i < stages.length - 1 && (
                <div style={{
                  width: 16,
                  height: 2,
                  background: i < active ? s.green : s.border,
                  flexShrink: 0,
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>

        {active >= 0 && (
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: 16,
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              fontSize: 11,
              fontFamily: s.mono,
              color: s.accent,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Stage {active + 1}: {stages[active].label}
            </div>
            <div style={{ color: s.text2, fontSize: 14, lineHeight: 1.6 }}>
              {stages[active].desc}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}

export default RenderPipelineDemo

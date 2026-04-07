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

const gibberishLines = [
  { text: 'def sort(arr):', type: 'good' },
  { text: '    # use quicksort for', type: 'good' },
  { text: '    pivot = arr[0]', type: 'good' },
  { text: '    return', type: 'good' },
  { text: '    # Questo e un errore', type: 'bad' },
  { text: '    Das ist falsch', type: 'bad' },
  { text: '    return 42', type: 'bad' },
  { text: '    <!-- FIN -->', type: 'bad' },
]

function CodeQualityBar({ label, usable, gibberish, color, delay }: {
  label: string
  usable: number
  gibberish: number
  color: string
  delay: number
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(usable), delay)
    return () => clearTimeout(t)
  }, [delay, usable])

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{label}</span>
        <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
          {usable}% usable / {gibberish}% gibberish
        </span>
      </div>
      <div style={{ height: 28, borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: 6,
          transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
        }} />
        {gibberish > 30 && (
          <span style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: s.text2,
            fontFamily: s.mono,
            whiteSpace: 'nowrap',
            opacity: width > 0 ? 1 : 0,
            transition: 'opacity 0.5s ease 1s',
          }}>
            ~{gibberish}% contains no extractable code
          </span>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value, delta, color, delay }: {
  label: string
  value: string
  delta: string
  color: string
  delay: number
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: 6,
      background: s.bg,
      border: `1px solid ${s.border}`,
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(8px)',
      transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      marginBottom: 6,
    }}>
      <span style={{ fontSize: 13, color: s.text2, fontFamily: s.mono }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: s.mono }}>{value}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          background: `${color}18`,
          padding: '2px 8px',
          borderRadius: 10,
          fontFamily: s.mono,
        }}>
          +{delta}
        </span>
      </div>
    </div>
  )
}

function GibberishReveal() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    gibberishLines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 600 + i * 350))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: s.bg2,
        borderBottom: `1px solid ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red }} />
        <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>high_temp_sample.py</span>
      </div>
      <div style={{ padding: '14px 16px', fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.8 }}>
        {gibberishLines.map((line, i) => (
          <div key={i} style={{
            color: line.type === 'good' ? s.green : s.red,
            opacity: i < visibleLines ? 1 : 0,
            transform: i < visibleLines ? 'translateX(0)' : 'translateX(-12px)',
            transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            whiteSpace: 'pre',
            position: 'relative',
          }}>
            {i < visibleLines && (
              <span style={{
                position: 'absolute',
                left: -14,
                fontSize: 10,
                color: s.text3,
              }}>
                {i + 1}
              </span>
            )}
            {line.text}
          </div>
        ))}
        {visibleLines === gibberishLines.length && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${s.border}`,
            color: s.yellow,
            fontSize: 11,
            opacity: 1,
            transition: 'opacity 0.6s ease',
          }}>
            {'{'} 4 lines of valid Python, then total garbage {'}'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BadDataDemo() {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 10,
          padding: 20,
          opacity: started ? 1 : 0,
          transform: started ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: s.green,
            marginBottom: 4,
            fontFamily: s.mono,
          }}>
            Normal SSD
          </div>
          <div style={{ fontSize: 12, color: s.text3, marginBottom: 16 }}>
            Standard temperature, truncated outputs
          </div>
          <CodeQualityBar label="Code Quality" usable={85} gibberish={15} color={s.green} delay={400} />
          <ResultRow label="pass@1" value="55.3%" delta="12.9pp" color={s.green} delay={800} />
          <ResultRow label="pass@5" value="71.6%" delta="18.1pp" color={s.green} delay={1000} />
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 10,
          padding: 20,
          opacity: started ? 1 : 0,
          transform: started ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: s.orange,
            marginBottom: 4,
            fontFamily: s.mono,
          }}>
            High-Temp SSD
          </div>
          <div style={{ fontSize: 12, color: s.text3, marginBottom: 16 }}>
            No truncation, temperature 1.5
          </div>
          <CodeQualityBar label="Code Quality" usable={38} gibberish={62} color={s.red} delay={500} />
          <ResultRow label="pass@1" value="48.1%" delta="5.7pp" color={s.orange} delay={1100} />
          <ResultRow label="pass@5" value="64.0%" delta="10.5pp" color={s.orange} delay={1300} />
        </div>
      </div>

      <div style={{
        background: s.bg2,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: started ? 1 : 0,
        transition: 'opacity 0.6s ease 0.6s',
      }}>
        <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, minWidth: 80 }}>BASELINE</span>
        <div style={{ flex: 1, height: 1, background: s.border, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: -3, height: 1, background: `repeating-linear-gradient(90deg, ${s.border2} 0, ${s.border2} 4px, transparent 4px, transparent 8px)` }} />
        </div>
        <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
          pass@1 <strong style={{ color: s.text }}>42.4%</strong>
        </span>
        <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
          pass@5 <strong style={{ color: s.text }}>53.5%</strong>
        </span>
      </div>

      <GibberishReveal />

      <div style={{
        marginTop: 20,
        background: `${s.accent}0a`,
        border: `1px solid ${s.accent}30`,
        borderRadius: 8,
        padding: '16px 20px',
        opacity: started ? 1 : 0,
        transition: 'opacity 0.8s ease 1.5s',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: s.accent,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          fontFamily: s.mono,
        }}>
          Key Insight
        </div>
        <div style={{
          fontSize: 13.5,
          color: s.text,
          lineHeight: 1.7,
        }}>
          The signal comes from token probability structure, not program correctness.
          Even gibberish contains information about which tokens are plausible in which contexts.
        </div>
      </div>
    </div>
  )
}

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

type ModelKey = '30b' | '4b' | '30b-think'
type MetricKey = 'pass1' | 'pass5'

const models: { key: ModelKey; label: string }[] = [
  { key: '30b', label: 'Qwen3-30B-Instruct' },
  { key: '4b', label: 'Qwen3-4B-Instruct' },
  { key: '30b-think', label: 'Qwen3-30B-Thinking' },
]

const difficulties = ['Easy', 'Medium', 'Hard'] as const

const data: Record<ModelKey, Record<MetricKey, { base: number[]; ssd: number[] }>> = {
  '30b': {
    pass1: { base: [84.5, 46.8, 18.3], ssd: [91.0, 61.0, 33.6] },
    pass5: { base: [93.3, 56.8, 31.1], ssd: [99.9, 76.4, 54.1] },
  },
  '4b': {
    pass1: { base: [79.7, 34.4, 10.5], ssd: [86.5, 45.1, 16.2] },
    pass5: { base: [90.0, 40.5, 16.5], ssd: [98.1, 59.7, 34.1] },
  },
  '30b-think': {
    pass1: { base: [99.8, 73.0, 41.5], ssd: [100.0, 76.4, 46.7] },
    pass5: { base: [100.0, 84.7, 59.7], ssd: [100.0, 87.1, 65.8] },
  },
}

function Bar({
  value,
  maxVal,
  color,
  delay,
  showLabel,
  label,
}: {
  value: number
  maxVal: number
  color: string
  delay: number
  showLabel: boolean
  label: string
}) {
  const [mounted, setMounted] = useState(false)
  const pct = (value / maxVal) * 100

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text, fontWeight: 600 }}>
        {value.toFixed(1)}
      </div>
      <div
        style={{
          width: 32,
          height: 140,
          background: s.bg,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${s.border}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${mounted ? pct : 0}%`,
            background: color,
            borderRadius: '0 0 3px 3px',
            transition: `height 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </div>
      {showLabel && (
        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, textAlign: 'center', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      )}
    </div>
  )
}

export default function SsdResultsDemo() {
  const [model, setModel] = useState<ModelKey>('30b')
  const [metric, setMetric] = useState<MetricKey>('pass1')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const d = data[model][metric]
  const maxVal = 105
  const deltas = d.ssd.map((v, i) => +(v - d.base[i]).toFixed(1))

  return (
    <DemoBoundary name="SSD Benchmark Results">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {models.map((m) => (
            <button
              key={m.key}
              onClick={() => setModel(m.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${model === m.key ? s.accent : s.border}`,
                background: model === m.key ? `${s.accent}22` : s.bg2,
                color: model === m.key ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Metric:</span>
          {(['pass1', 'pass5'] as const).map((mk) => (
            <button
              key={mk}
              onClick={() => setMetric(mk)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: `1px solid ${metric === mk ? s.yellow : s.border}`,
                background: metric === mk ? `${s.yellow}18` : s.bg2,
                color: metric === mk ? s.yellow : s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {mk === 'pass1' ? 'pass@1' : 'pass@5'}
            </button>
          ))}
        </div>

        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.4s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
            {difficulties.map((diff, di) => {
              const baseVal = d.base[di]
              const ssdVal = d.ssd[di]
              const delta = deltas[di]

              return (
                <div
                  key={diff}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: s.text2, fontWeight: 600, marginBottom: 2 }}>
                    {diff}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Bar
                      value={baseVal}
                      maxVal={maxVal}
                      color={s.text3}
                      delay={200 + di * 120}
                      showLabel
                      label="Base"
                    />
                    <Bar
                      value={ssdVal}
                      maxVal={maxVal}
                      color={s.accent}
                      delay={350 + di * 120}
                      showLabel
                      label="+SSD"
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: s.mono,
                      color: delta > 0 ? s.green : s.text3,
                      fontWeight: 600,
                      opacity: mounted ? 1 : 0,
                      transition: `opacity 0.3s ease ${600 + di * 120}ms`,
                    }}
                  >
                    {delta > 0 ? `+${delta}pp` : `${delta}pp`}
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
              padding: '8px 16px',
              background: `${s.green}10`,
              border: `1px solid ${s.green}30`,
              borderRadius: 6,
              opacity: mounted ? 1 : 0,
              transition: `opacity 0.4s ease 0.9s`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3L8 13M8 3L4 7M8 3L12 7" stroke={s.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: s.green, fontFamily: s.mono }}>
              Hard problems improve most
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            marginTop: 16,
            opacity: mounted ? 1 : 0,
            transition: `opacity 0.3s ease 0.6s`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.text3 }} />
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Base</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>+SSD</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
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

const levels = [
  {
    name: 'Registers',
    size: '~1 KB',
    cycles: 1,
    ns: 0.3,
    detail: 'CPU registers sit directly on the processor core. The ALU reads operands from registers in a single cycle.',
    color: s.red,
    analogy: '1 second',
    analogyUnit: 'second',
  },
  {
    name: 'L1 Cache',
    size: '~32 KB',
    cycles: 3,
    ns: 1,
    detail: 'L1 cache runs at CPU clock speed. Modern CPUs have separate L1d (data) and L1i (instruction) caches.',
    color: s.orange,
    analogy: '3',
    analogyUnit: 'seconds',
  },
  {
    name: 'L2 Cache',
    size: '~256 KB',
    cycles: 12,
    ns: 4,
    detail: 'L2 cache is larger but slightly slower than L1. It catches most misses from the L1 cache.',
    color: s.yellow,
    analogy: '12',
    analogyUnit: 'seconds',
  },
  {
    name: 'L3 Cache',
    size: '~8 MB',
    cycles: 40,
    ns: 15,
    detail: 'L3 cache is shared across all CPU cores. It reduces latency for multi-threaded workloads.',
    color: s.accent,
    analogy: '40',
    analogyUnit: 'seconds',
  },
  {
    name: 'RAM',
    size: '~16 GB',
    cycles: 200,
    ns: 80,
    detail: 'Main memory (DRAM) is orders of magnitude slower than cache. It stores all actively used data and code.',
    color: s.purple,
    analogy: '3.3',
    analogyUnit: 'minutes',
  },
  {
    name: 'Disk',
    size: '~1 TB',
    cycles: 1000000,
    ns: 10000000,
    detail: 'SSDs and HDDs provide bulk storage. Even fast NVMe drives are millions of cycles away from the CPU.',
    color: s.green,
    analogy: '11.5',
    analogyUnit: 'days',
  },
]

const barW = [22, 32, 44, 56, 72, 90]

export default function CacheHierarchyDemo() {
  const [selected, setSelected] = useState<number | null>(null)
  const [touring, setTouring] = useState(false)
  const tourRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTour = useCallback(() => {
    if (tourRef.current) {
      clearInterval(tourRef.current)
      tourRef.current = null
    }
    setTouring(false)
  }, [])

  const startTour = useCallback(() => {
    setSelected(0)
    setTouring(true)
  }, [])

  useEffect(() => {
    if (!touring) return
    tourRef.current = setInterval(() => {
      setSelected(prev => {
        if (prev === null || prev >= levels.length - 1) {
          if (tourRef.current) clearInterval(tourRef.current)
          tourRef.current = null
          setTouring(false)
          return prev
        }
        return prev + 1
      })
    }, 2200)
    return () => {
      if (tourRef.current) clearInterval(tourRef.current)
    }
  }, [touring])

  useEffect(() => {
    return () => {
      if (tourRef.current) clearInterval(tourRef.current)
    }
  }, [])

  const handleSelect = (idx: number) => {
    if (touring) return
    setSelected(prev => prev === idx ? null : idx)
  }

  const formatNs = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(0)} ms`
    if (v >= 1000) return `${(v / 1000).toFixed(0)} us`
    return v < 1 ? `${v} ns` : `${v} ns`
  }

  return (
    <DemoBoundary name="CPU Memory Hierarchy">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CPU Memory Hierarchy</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 12px 0', lineHeight: 1.6 }}>
          Memory gets larger and slower as we move away from the CPU core. Click any level for details.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          {levels.map((lv, i) => {
            const isSelected = selected === i
            return (
              <div
                key={lv.name}
                onClick={() => handleSelect(i)}
                style={{
                  width: `${barW[i]}%`,
                  height: 48,
                  background: isSelected ? lv.color + '33' : lv.color + '15',
                  borderLeft: `3px solid ${isSelected ? lv.color : lv.color + '66'}`,
                  borderRadius: 6,
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: touring ? 'default' : 'pointer',
                  transition: 'all 0.25s ease',
                  opacity: touring && selected !== null && selected !== i ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (!touring) {
                    e.currentTarget.style.background = lv.color + '28'
                  }
                }}
                onMouseLeave={e => {
                  if (!touring) {
                    e.currentTarget.style.background = isSelected ? lv.color + '33' : lv.color + '15'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: lv.color, flexShrink: 0 }} />
                  <span style={{ color: isSelected ? s.text : s.text2, fontSize: 13, fontWeight: isSelected ? 700 : 500, transition: 'color 0.2s' }}>
                    {lv.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{lv.size}</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>~{lv.cycles.toLocaleString()}c</span>
                </div>
              </div>
            )
          })}
        </div>

        {selected !== null && (
          <div style={{
            background: s.bg,
            border: `1px solid ${levels[selected].color}44`,
            borderRadius: 10,
            padding: '18px 20px',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: levels[selected].color, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 16, fontWeight: 700 }}>{levels[selected].name}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 2 }}>Size</div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{levels[selected].size}</div>
              </div>
              <div>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 2 }}>Latency</div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>
                  ~{levels[selected].cycles.toLocaleString()} cycles ({formatNs(levels[selected].ns)})
                </div>
              </div>
              <div>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 2 }}>Analogy</div>
                <div style={{ color: levels[selected].color, fontFamily: s.mono, fontSize: 13 }}>
                  {levels[selected].analogy} {levels[selected].analogyUnit}
                </div>
              </div>
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
              {levels[selected].detail}
            </div>
            <div style={{
              marginTop: 12,
              background: levels[selected].color + '11',
              border: `1px solid ${levels[selected].color}33`,
              borderRadius: 8,
              padding: '10px 14px',
              color: levels[selected].color,
              fontSize: 13,
              fontFamily: s.mono,
            }}>
              If register access takes 1 second, accessing {levels[selected].name} takes ~{levels[selected].analogy} {levels[selected].analogyUnit}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={touring ? stopTour : startTour}
            style={{
              background: touring ? s.red : s.bg3,
              border: `1px solid ${touring ? s.red : s.border}`,
              borderRadius: 8,
              padding: '10px 20px',
              color: touring ? '#fff' : s.text2,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: touring ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {touring ? 'Stop Tour' : 'Start Tour'}
          </button>
          {selected !== null && !touring && (
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'transparent',
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '10px 20px',
                color: s.text3,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

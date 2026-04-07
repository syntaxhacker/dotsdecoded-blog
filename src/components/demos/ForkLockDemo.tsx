import { useState } from 'react'
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

type BarData = { label: string; value: number; color: string }

const forkBefore: BarData[] = [
  { label: 'Path A', value: 0.40, color: s.accent },
  { label: 'Path B', value: 0.25, color: s.accent },
  { label: 'Path C', value: 0.20, color: s.accent },
  { label: 'Path D', value: 0.15, color: s.accent },
  { label: 'Tail 1', value: 0.06, color: s.red },
  { label: 'Tail 2', value: 0.04, color: s.red },
  { label: 'Tail 3', value: 0.03, color: s.red },
  { label: 'Tail 4', value: 0.02, color: s.red },
  { label: 'Tail 5', value: 0.01, color: s.red },
  { label: 'Tail 6', value: 0.01, color: s.red },
]

const forkAfter: BarData[] = [
  { label: 'Path A', value: 0.30, color: s.accent },
  { label: 'Path B', value: 0.28, color: s.accent },
  { label: 'Path C', value: 0.25, color: s.accent },
  { label: 'Path D', value: 0.17, color: s.accent },
]

const lockBefore: BarData[] = [
  { label: 'Top', value: 0.85, color: s.green },
  { label: 'Distr 1', value: 0.05, color: s.red },
  { label: 'Distr 2', value: 0.04, color: s.red },
  { label: 'Distr 3', value: 0.03, color: s.red },
  { label: 'Distr 4', value: 0.03, color: s.red },
]

const lockAfter: BarData[] = [
  { label: 'Top', value: 0.95, color: s.green },
  { label: 'Distr 1', value: 0.02, color: s.red },
  { label: 'Distr 2', value: 0.01, color: s.red },
  { label: 'Distr 3', value: 0.01, color: s.red },
  { label: 'Distr 4', value: 0.01, color: s.red },
]

const BAR_H = 220

function BarChart({ data, boundary, showBoundary }: { data: BarData[]; boundary: number; showBoundary: boolean }) {
  const maxVal = Math.max(...data.map(d => d.value))
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {showBoundary && (
        <div style={{
          position: 'absolute',
          left: `${boundary * 100}%`,
          top: 0,
          bottom: 28,
          width: 2,
          borderLeft: `2px dashed ${s.yellow}`,
          zIndex: 2,
        }}>
          <div style={{
            position: 'absolute',
            top: -18,
            left: 4,
            fontSize: 10,
            fontFamily: s.mono,
            color: s.yellow,
            whiteSpace: 'nowrap',
          }}>
            support boundary
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: BAR_H, padding: '0 4px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontSize: 10,
              fontFamily: s.mono,
              color: s.text3,
              marginBottom: 3,
            }}>
              {(d.value * 100).toFixed(0)}%
            </div>
            <div style={{
              width: '100%',
              maxWidth: 52,
              minWidth: 14,
              height: `${(d.value / maxVal) * (BAR_H - 40)}px`,
              background: d.color,
              borderRadius: '4px 4px 2px 2px',
              transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.9,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 9,
            fontFamily: s.mono,
            color: s.text3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ForkLockDemo() {
  const [showAfter, setShowAfter] = useState(false)

  const forkData = showAfter ? forkAfter : forkBefore
  const lockData = showAfter ? lockAfter : lockBefore

  const forkBoundary = showAfter ? 1.0 : 0.40
  const lockBoundary = showAfter ? 0.20 : 0.20

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
      }}>
        <span style={{
          fontSize: 13,
          color: showAfter ? s.text3 : s.text,
          transition: 'color 0.3s',
          fontWeight: showAfter ? 400 : 600,
        }}>Before SSD</span>
        <button
          onClick={() => setShowAfter(v => !v)}
          style={{
            position: 'relative',
            width: 48,
            height: 26,
            borderRadius: 13,
            border: `2px solid ${showAfter ? s.green : s.border}`,
            background: showAfter ? s.green : 'transparent',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.3s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: showAfter ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: showAfter ? s.bg : s.text3,
            transition: 'left 0.3s, background 0.3s',
          }} />
        </button>
        <span style={{
          fontSize: 13,
          color: showAfter ? s.text : s.text3,
          transition: 'color 0.3s',
          fontWeight: showAfter ? 600 : 400,
        }}>After SSD</span>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{
          flex: 1,
          background: s.bg2,
          borderRadius: 10,
          border: `1px solid ${s.border}`,
          padding: '16px 16px 12px',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: s.accent,
            marginBottom: 4,
          }}>
            Fork
            <span style={{
              fontSize: 11,
              fontWeight: 400,
              color: s.text3,
              marginLeft: 8,
            }}>
              {showAfter ? 'plateau' : 'spiky tail'}
            </span>
          </div>
          <div style={{
            fontSize: 11,
            color: s.text3,
            marginBottom: 12,
            lineHeight: 1.4,
          }}>
            Multiple viable paths diverge. Useful diversity.
          </div>
          <BarChart data={forkData} boundary={forkBoundary} showBoundary={true} />
        </div>

        <div style={{
          flex: 1,
          background: s.bg2,
          borderRadius: 10,
          border: `1px solid ${s.border}`,
          padding: '16px 16px 12px',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: s.green,
            marginBottom: 4,
          }}>
            Lock
            <span style={{
              fontSize: 11,
              fontWeight: 400,
              color: s.text3,
              marginLeft: 8,
            }}>
              {showAfter ? 'spike sharpened' : 'distractors present'}
            </span>
          </div>
          <div style={{
            fontSize: 11,
            color: s.text3,
            marginBottom: 12,
            lineHeight: 1.4,
          }}>
            One dominant token. Distractors compete.
          </div>
          <BarChart data={lockData} boundary={lockBoundary} showBoundary={true} />
        </div>
      </div>

      <div style={{
        marginTop: 16,
        padding: '10px 16px',
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        color: s.text2,
        lineHeight: 1.5,
        textAlign: 'center',
      }}>
        SSD suppresses distractor tails at{' '}
        <span style={{ color: s.green, fontWeight: 600 }}>locks</span>
        {' '}while preserving useful diversity at{' '}
        <span style={{ color: s.accent, fontWeight: 600 }}>forks</span>
      </div>
    </div>
  )
}

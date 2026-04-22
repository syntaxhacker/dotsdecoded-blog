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

function temperProbs(probs: number[], temperature: number): number[] {
  const t = Math.max(temperature, 0.01)
  const powered = probs.map(p => Math.pow(p, 1 / t))
  const sum = powered.reduce((a, b) => a + b, 0)
  return powered.map(p => p / sum)
}

const lockBase = [
  { label: 'length', prob: 0.85, color: s.green },
  { label: 'push', prob: 0.05, color: s.accent },
  { label: 'pop', prob: 0.04, color: s.purple },
  { label: 'size', prob: 0.03, color: s.orange },
  { label: 'sort', prob: 0.03, color: s.red },
]

const forkBase = [
  { label: 'for loop', prob: 0.35, color: s.accent },
  { label: 'recursive', prob: 0.30, color: s.green },
  { label: 'built-in', prob: 0.20, color: s.purple },
  { label: 'iterators', prob: 0.15, color: s.orange },
]

function HealthBadge({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', background: color,
        boxShadow: `0 0 8px ${color}`,
        transition: 'background 0.4s, box-shadow 0.4s',
      }} />
      <span style={{ fontSize: 13, color: s.text2, fontFamily: s.mono }}>{label}</span>
    </div>
  )
}

function BarGroup({ tokens, tempered, title }: {
  tokens: typeof lockBase
  tempered: number[]
  title: string
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 14, fontWeight: 600, color: s.text2,
        marginBottom: 12, letterSpacing: '0.5px',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tokens.map((tok, i) => (
          <div key={tok.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 72, fontSize: 12, color: s.text3, fontFamily: s.mono,
              textAlign: 'right', flexShrink: 0,
            }}>{tok.label}</div>
            <div style={{
              flex: 1, height: 26, background: s.bg3, borderRadius: 4,
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                height: '100%', width: `${tempered[i] * 100}%`,
                background: tok.color, borderRadius: 4,
                transition: 'width 0.3s ease',
                minWidth: tempered[i] > 0.005 ? 2 : 0,
              }} />
              <div style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, fontFamily: s.mono, color: s.text2,
              }}>{(tempered[i] * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getLockHealth(t: number): { color: string; label: string } {
  if (t <= 0.6) return { color: s.green, label: 'Precise' }
  if (t <= 1.3) return { color: s.yellow, label: 'Distractors rising' }
  return { color: s.red, label: 'Distractors flooding in' }
}

function getForkHealth(t: number): { color: string; label: string } {
  if (t <= 0.5) return { color: s.red, label: 'No exploration' }
  if (t <= 1.2) return { color: s.yellow, label: 'Warming up' }
  return { color: s.green, label: 'Good exploration' }
}

export default function PrecisionExplorationDemo() {
  const [temperature, setTemperature] = useState(1.0)

  const lockTempered = useMemo(
    () => temperProbs(lockBase.map(t => t.prob), temperature),
    [temperature]
  )
  const forkTempered = useMemo(
    () => temperProbs(forkBase.map(t => t.prob), temperature),
    [temperature]
  )

  const lockHealth = getLockHealth(temperature)
  const forkHealth = getForkHealth(temperature)

  return (
    <DemoBoundary name="Precision vs Exploration">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '24px 28px',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 14, color: s.text2, fontWeight: 500 }}>Temperature</span>
            <span style={{
              fontSize: 22, fontFamily: s.mono, fontWeight: 700, color: s.accent,
            }}>{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range" min={0.1} max={2.0} step={0.1} value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            style={{
              width: '100%', height: 6, appearance: 'none', background: s.bg3,
              borderRadius: 3, outline: 'none', cursor: 'pointer',
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: s.text3, marginTop: 4, fontFamily: s.mono,
          }}>
            <span>0.1 (precise)</span>
            <span>1.0</span>
            <span>2.0 (creative)</span>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 24,
          padding: '20px 0', borderTop: `1px solid ${s.border}`,
          borderBottom: `1px solid ${s.border}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <BarGroup tokens={lockBase} tempered={lockTempered} title="Lock Position" />
            <HealthBadge color={lockHealth.color} label={lockHealth.label} />
          </div>
          <div style={{ width: 1, background: s.border, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <BarGroup tokens={forkBase} tempered={forkTempered} title="Fork Position" />
            <HealthBadge color={forkHealth.color} label={forkHealth.label} />
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: '12px 16px', background: s.bg2,
          borderRadius: 8, border: `1px solid ${s.border}`,
          fontSize: 13, color: s.text2, lineHeight: 1.6,
        }}>
          <span style={{ color: s.yellow, fontWeight: 600 }}>No single temperature satisfies both.</span>
          {' '}Low T keeps the lock precise but starves the fork. High T opens the fork but drowns the lock in noise.
          The model needs different temperatures at different positions.
        </div>
      </div>
    </DemoBoundary>
  )
}

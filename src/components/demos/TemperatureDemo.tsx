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

const ORIGINAL = [0.35, 0.20, 0.15, 0.10, 0.08, 0.05, 0.03, 0.02, 0.015, 0.005]
const TOKENS = ORIGINAL.map((_, i) => `t${i + 1}`)

function applyTemperature(probs: number[], t: number): number[] {
  const scaled = probs.map(p => Math.pow(p, 1 / t))
  const sum = scaled.reduce((a, b) => a + b, 0)
  return scaled.map(v => v / sum)
}

function applyTopK(probs: number[], k: number): number[] {
  const indexed = probs.map((p, i) => ({ p, i }))
  indexed.sort((a, b) => b.p - a.p)
  const topSet = new Set(indexed.slice(0, k).map(x => x.i))
  const result = probs.map((p, i) => (topSet.has(i) ? p : 0))
  const sum = result.reduce((a, b) => a + b, 0)
  return sum > 0 ? result.map(v => v / sum) : result
}

function applyTopP(probs: number[], pThreshold: number): number[] {
  const indexed = probs.map((p, i) => ({ p, i }))
  indexed.sort((a, b) => b.p - a.p)
  let cumSum = 0
  const keepSet = new Set<number>()
  for (const item of indexed) {
    keepSet.add(item.i)
    cumSum += item.p
    if (cumSum >= pThreshold) break
  }
  const result = probs.map((p, i) => (keepSet.has(i) ? p : 0))
  const sum = result.reduce((a, b) => a + b, 0)
  return sum > 0 ? result.map(v => v / sum) : result
}

function retainedCount(probs: number[]): number {
  return probs.filter(p => p > 0).length
}

const sliderStyle = (color: string) => ({
  input: {
    width: '100%', appearance: 'none' as const, background: 'transparent',
    cursor: 'pointer', outline: 'none',
  },
  track: `height: 6px; border-radius: 3px; background: ${s.bg3};`,
  thumb: `-webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${color}; margin-top: -5px; border: 2px solid ${s.bg}; box-shadow: 0 0 6px ${color}44;`,
  thumbHover: `box-shadow: 0 0 12px ${color}88;`,
  mozTrack: `height: 6px; border-radius: 3px; background: ${s.bg3}; border: none;`,
  mozThumb: `width: 16px; height: 16px; border-radius: 50%; background: ${color}; border: 2px solid ${s.bg}; box-shadow: 0 0 6px ${color}44;`,
})

function SliderRow({ label, value, min, max, step, color, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  color: string; onChange: (v: number) => void
}) {
  const st = sliderStyle(color)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 110, fontSize: 13, fontWeight: 600, color: s.text2, fontFamily: s.mono, flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))} style={st.input} />
        <style>{`
          input[type="range"]::-webkit-slider-runnable-track { ${st.track} }
          input[type="range"]::-webkit-slider-thumb { ${st.thumb} }
          input[type="range"]::-webkit-slider-thumb:hover { ${st.thumbHover} }
          input[type="range"]::-moz-range-track { ${st.mozTrack} }
          input[type="range"]::-moz-range-thumb { ${st.mozThumb} }
        `}</style>
      </div>
      <div style={{ width: 48, textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: s.mono, color }}>
        {value.toFixed(step < 1 ? 2 : 0)}
      </div>
    </div>
  )
}

function BarRow({ label, prob, isDropped, maxProb }: {
  label: string; prob: number; isDropped: boolean; maxProb: number
}) {
  const barWidth = maxProb > 0 ? (prob / maxProb) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22 }}>
      <div style={{
        width: 24, fontSize: 12, fontFamily: s.mono, fontWeight: 600,
        color: isDropped ? s.red + '66' : s.text3, flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 16, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${barWidth}%`, height: '100%',
          background: isDropped
            ? `linear-gradient(90deg, ${s.red}33, ${s.red}22)`
            : `linear-gradient(90deg, ${s.accent}cc, ${s.accent})`,
          borderRadius: 4,
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      </div>
      <div style={{
        width: 56, textAlign: 'right', fontSize: 11, fontFamily: s.mono,
        fontWeight: 600, color: isDropped ? s.red + '66' : s.text2,
        transition: 'color 0.3s ease',
      }}>
        {isDropped ? '---' : `${(prob * 100).toFixed(2)}%`}
      </div>
    </div>
  )
}

function StageSection({ title, probs, originalOrder }: {
  title: string; probs: number[]; originalOrder: number[]
}) {
  const maxProb = Math.max(...probs)
  const kept = retainedCount(probs)
  return (
    <div style={{
      padding: '12px 14px', background: s.bg2, borderRadius: 8,
      border: `1px solid ${s.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
        <div style={{
          fontSize: 11, fontFamily: s.mono, fontWeight: 600,
          color: kept === 10 ? s.green : s.orange,
          background: (kept === 10 ? s.green : s.orange) + '15',
          padding: '2px 8px', borderRadius: 10,
        }}>
          Retained: {kept}/10
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {originalOrder.map(i => (
          <BarRow key={i} label={TOKENS[i]} prob={probs[i]} isDropped={probs[i] === 0} maxProb={maxProb} />
        ))}
      </div>
    </div>
  )
}

export default function TemperatureDemo() {
  const [temperature, setTemperature] = useState(1.0)
  const [topK, setTopK] = useState(10)
  const [topP, setTopP] = useState(1.0)

  const originalOrder = useMemo(() => ORIGINAL.map((_, i) => i), [])

  const afterTemp = useMemo(() => applyTemperature(ORIGINAL, temperature), [temperature])
  const afterTopK = useMemo(() => applyTopK(afterTemp, topK), [afterTemp, topK])
  const afterTopP = useMemo(() => applyTopP(afterTopK, topP), [afterTopK, topP])

  return (
    <DemoBoundary name="Temperature and Truncation">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 24, overflow: 'visible',
      }}>
        <div style={{
          padding: '10px 14px', background: s.bg2, borderRadius: 8,
          border: `1px solid ${s.border}`, marginBottom: 16,
          fontFamily: s.mono, fontSize: 13, color: s.text2,
          textAlign: 'center',
        }}>
          p<sup>T</sup>(v) = p(v)<sup>1/T</sup> / {'\u03A3'} p(u)<sup>1/T</sup>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14,
          padding: '14px 14px', background: s.bg2, borderRadius: 8,
          border: `1px solid ${s.border}`, marginBottom: 16,
        }}>
          <SliderRow label="Temperature" value={temperature} min={0.1} max={3.0} step={0.05} color={s.yellow} onChange={setTemperature} />
          <SliderRow label="top-k" value={topK} min={1} max={10} step={1} color={s.green} onChange={setTopK} />
          <SliderRow label="top-p" value={topP} min={0.1} max={1.0} step={0.05} color={s.purple} onChange={setTopP} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StageSection title="Original Distribution" probs={ORIGINAL} originalOrder={originalOrder} />
          <StageSection title="After Temperature" probs={afterTemp} originalOrder={originalOrder} />
          <StageSection title="After top-k" probs={afterTopK} originalOrder={originalOrder} />
          <StageSection title="After top-p (final)" probs={afterTopP} originalOrder={originalOrder} />
        </div>
      </div>
    </DemoBoundary>
  )
}

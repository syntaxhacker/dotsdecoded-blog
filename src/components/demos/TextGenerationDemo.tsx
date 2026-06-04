import { useState, useEffect, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const SEQUENCES: Record<string, string> = {
  '0.1': "To be or not to be that is the question",
  '0.8': "To be or not to be that is the point where we must consider",
  '1.5': "To breath or not to breath the air of question's fire",
}

const SPEEDS = { slow: 150, medium: 50, fast: 12 } as const

const POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,'!?;:-"

function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123
  return x - Math.floor(x)
}

function getSequence(temperature: number): string {
  if (temperature <= 0.45) return SEQUENCES['0.1']
  if (temperature <= 1.15) return SEQUENCES['0.8']
  return SEQUENCES['1.5']
}

interface CharProb {
  char: string
  prob: number
}

function generateProbs(step: number, char: string, temperature: number): CharProb[] {
  const candidates: string[] = [char]
  let rng = hash(step * 7919 + 1)
  while (candidates.length < 10) {
    rng = hash(Math.floor(rng * 2147483647))
    const c = POOL[Math.floor(rng * POOL.length)]
    if (!candidates.includes(c)) candidates.push(c)
  }

  const peakedness = Math.max(0.2, 0.9 - temperature * 0.35)
  let state = hash(step * 7 + 13)
  const raw = candidates.map((_, i) => {
    if (i === 0) return peakedness
    state = hash(Math.floor(state * 2147483647))
    return ((1 - peakedness) / 9) * (0.2 + 0.8 * state)
  })

  const scaled = raw.map(p => Math.pow(Math.max(p, 0.001), 1 / temperature))
  const sum = scaled.reduce((a, b) => a + b, 0)
  const result = candidates.map((c, i) => ({ char: c, prob: scaled[i] / sum }))
  return result.sort((a, b) => b.prob - a.prob)
}

export default function TextGenerationDemo() {
  const [temperature, setTemperature] = useState(0.8)
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')
  const [visibleChars, setVisibleChars] = useState(0)
  const [generating, setGenerating] = useState(true)
  const [genKey, setGenKey] = useState(0)

  const sequence = useMemo(() => getSequence(temperature), [temperature, genKey])
  const totalChars = sequence.length

  useEffect(() => {
    if (!generating || visibleChars >= totalChars) return
    const delay = SPEEDS[speed]
    const timer = setTimeout(() => setVisibleChars(prev => prev + 1), delay)
    return () => clearTimeout(timer)
  }, [generating, visibleChars, totalChars, speed])

  const currentChar = visibleChars < totalChars ? sequence[visibleChars] : sequence[totalChars - 1]
  const probs = useMemo(
    () => (visibleChars < totalChars ? generateProbs(visibleChars, currentChar, temperature) : []),
    [visibleChars, currentChar, temperature, totalChars]
  )

  const handleRegenerate = () => {
    setVisibleChars(0)
    setGenerating(true)
    setGenKey(prev => prev + 1)
  }

  const isComplete = visibleChars >= totalChars
  const maxProb = probs.length > 0 ? probs[0].prob : 0

  return (
    <DemoBoundary name="Text Generation">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 24,
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
          input[type="range"]::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: ${s.bg3}; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${s.yellow}; margin-top: -5px; border: 2px solid ${s.bg}; box-shadow: 0 0 6px ${s.yellow}44; }
          input[type="range"]::-moz-range-track { height: 6px; border-radius: 3px; background: ${s.bg3}; border: none; }
          input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${s.yellow}; border: 2px solid ${s.bg}; box-shadow: 0 0 6px ${s.yellow}44; }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            fontSize: 13, fontFamily: s.mono, color: s.text2,
            background: s.bg2, padding: '4px 12px', borderRadius: 6,
            border: `1px solid ${s.border}`,
          }}>
            {isComplete
              ? `Complete! ${totalChars} characters`
              : `Generating character ${visibleChars + 1} of ${totalChars}`}
          </div>
        </div>

        <div style={{
          padding: '16px 20px', background: s.bg2, borderRadius: 8,
          border: `1px solid ${s.border}`, marginBottom: 20,
          minHeight: 60, display: 'flex', alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 22, lineHeight: 1.6, fontFamily: s.mono, color: s.text }}>
            {sequence.split('').slice(0, visibleChars).map((ch, i) => (
              <span key={i} style={{ animation: i === visibleChars - 1 ? 'fadeIn 0.25s ease' : 'none' }}>
                {ch}
              </span>
            ))}
            <span style={{
              display: 'inline-block', width: 2, height: 26,
              background: s.accent, marginLeft: 1, verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }} />
          </div>
        </div>

        <div style={{
          padding: '12px 16px', background: s.bg2, borderRadius: 8,
          border: `1px solid ${s.border}`, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, fontFamily: s.mono, width: 100, flexShrink: 0 }}>
              Temperature
            </div>
            <input type="range" min={0.1} max={2.0} step={0.05} value={temperature}
              onChange={e => {
                setTemperature(parseFloat(e.target.value))
                setVisibleChars(0)
                setGenerating(true)
                setGenKey(prev => prev + 1)
              }}
              style={{
                flex: 1, appearance: 'none', background: 'transparent',
                cursor: 'pointer', outline: 'none', height: 6,
              }} />
            <div style={{
              width: 48, textAlign: 'right', fontSize: 14, fontWeight: 700,
              fontFamily: s.mono, color: s.yellow,
            }}>
              {temperature.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
          {(Object.keys(SPEEDS) as Array<keyof typeof SPEEDS>).map(spd => (
            <button key={spd} onClick={() => setSpeed(spd)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: `1px solid ${speed === spd ? s.accent : s.border}`,
                background: speed === spd ? s.accent + '22' : s.bg2,
                color: speed === spd ? s.accent : s.text2,
                fontFamily: s.mono, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}>
              {spd}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={handleRegenerate}
            style={{
              padding: '6px 18px', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text, fontFamily: s.mono,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s',
            }}>
            Regenerate
          </button>
        </div>

        <div style={{
          padding: '12px 16px', background: s.bg2, borderRadius: 8,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, fontFamily: s.mono, marginBottom: 10 }}>
            Next character probabilities
          </div>
          {probs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {probs.map((item, i) => {
                const barWidth = maxProb > 0 ? (item.prob / maxProb) * 100 : 0
                return (
                  <div key={`${visibleChars}-${i}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8, height: 22,
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{
                      width: 20, fontSize: 13, fontFamily: s.mono, fontWeight: 600,
                      color: i === 0 ? s.accent : s.text3, textAlign: 'center',
                    }}>
                      {item.char === ' ' ? '\u2423' : item.char}
                    </div>
                    <div style={{ flex: 1, height: 14, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${barWidth}%`, height: '100%',
                        background: i === 0
                          ? `linear-gradient(90deg, ${s.accent}, ${s.accent}cc)`
                          : `linear-gradient(90deg, ${s.text3}44, ${s.text3}33)`,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{
                      width: 52, textAlign: 'right', fontSize: 11,
                      fontFamily: s.mono, fontWeight: 600, color: s.text2,
                    }}>
                      {(item.prob * 100).toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono, textAlign: 'center', padding: '8px 0' }}>
              Generation complete
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}

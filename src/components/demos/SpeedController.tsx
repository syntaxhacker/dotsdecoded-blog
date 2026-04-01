import { useState } from 'react'

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
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const speeds = [
  { label: '0.5x', value: 2 },
  { label: '1x', value: 1 },
  { label: '2x', value: 0.5 },
  { label: '4x', value: 0.25 },
]

interface Props {
  speed: number
  onSpeedChange: (multiplier: number) => void
}

export default function SpeedController({ speed, onSpeedChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: '4px 10px',
          color: s.text3,
          fontFamily: s.mono,
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ color: s.text2 }}>{speed === 1 ? '1x' : speed < 1 ? `${Math.round(1 / speed)}x` : `${speed}x`}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: 4,
          display: 'flex',
          gap: 2,
          zIndex: 10,
        }}>
          {speeds.map((sp) => (
            <button
              key={sp.label}
              onClick={() => {
                onSpeedChange(sp.value)
                setOpen(false)
              }}
              style={{
                background: speed === sp.value ? s.bg3 : 'transparent',
                border: 'none',
                borderRadius: 5,
                padding: '4px 10px',
                color: speed === sp.value ? s.text : s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {sp.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function getStepDelay(baseDelay: number, speed: number): number {
  return baseDelay * speed
}

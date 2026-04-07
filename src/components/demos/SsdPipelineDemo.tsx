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
  {
    num: 1,
    title: 'Sample',
    desc: 'Generate solutions from the model at T_train. No correctness check. Raw outputs become training data.',
    color: s.accent,
  },
  {
    num: 2,
    title: 'Train',
    desc: 'Fine-tune on raw outputs using standard cross-entropy loss. The temperature-shifted target breaks the self-training fixed point.',
    color: s.green,
  },
  {
    num: 3,
    title: 'Deploy',
    desc: 'Use the fine-tuned model at T_eval. The model generates better code, especially on hard problems.',
    color: s.orange,
  },
]

function Arrow({ active }: { active: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      flexShrink: 0,
      opacity: active ? 1 : 0.3,
      transition: 'opacity 0.4s ease',
    }}>
      <svg width="48" height="20" viewBox="0 0 48 20">
        <line
          x1="0" y1="10" x2="36" y2="10"
          stroke={active ? s.accent : s.border2}
          strokeWidth="2"
          strokeDasharray="6 4"
          style={{
            animation: active ? 'dashFlow 0.8s linear infinite' : 'none',
          }}
        />
        <polygon
          points="34,4 44,10 34,16"
          fill={active ? s.accent : s.border2}
          style={{
            animation: active ? 'pulse 1.2s ease-in-out infinite' : 'none',
          }}
        />
      </svg>
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

function StageCard({ stage, active }: { stage: typeof stages[0]; active: boolean }) {
  return (
    <div style={{
      flex: 1,
      background: active ? s.bg2 : s.bg,
      border: `1.5px solid ${active ? stage.color : s.border}`,
      borderRadius: 10,
      padding: '20px 16px',
      transition: 'all 0.4s ease',
      opacity: active ? 1 : 0.45,
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: active ? stage.color : s.bg3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: s.mono,
          fontSize: 14,
          fontWeight: 700,
          color: active ? s.bg : s.text3,
          transition: 'all 0.4s ease',
        }}>
          {stage.num}
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: active ? stage.color : s.text3,
          transition: 'color 0.4s ease',
          fontFamily: s.mono,
        }}>
          {stage.title}
        </div>
      </div>
      <div style={{
        fontSize: 13,
        lineHeight: 1.6,
        color: active ? s.text2 : s.text3,
        transition: 'color 0.4s ease',
      }}>
        {stage.desc}
      </div>
    </div>
  )
}

export default function SsdPipelineDemo() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % 3)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        marginBottom: 20,
      }}>
        <StageCard stage={stages[0]} active={active === 0} />
        <Arrow active={active === 0 || active === 1} />
        <StageCard stage={stages[1]} active={active === 1} />
        <Arrow active={active === 1 || active === 2} />
        <StageCard stage={stages[2]} active={active === 2} />
      </div>
      <div style={{
        background: `${s.accent}10`,
        border: `1px solid ${s.accent}30`,
        borderRadius: 8,
        padding: '14px 18px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 13,
          color: s.accent,
          fontWeight: 600,
          fontFamily: s.mono,
          marginBottom: 4,
        }}>
          Key Insight
        </div>
        <div style={{
          fontSize: 13,
          color: s.text2,
          lineHeight: 1.5,
        }}>
          No teacher model. No verifier. No reinforcement learning. Just the model's own raw outputs.
        </div>
      </div>
    </div>
  )
}

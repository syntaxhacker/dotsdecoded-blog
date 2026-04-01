import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

interface Example {
  label: string
  jsx: string
  rendered: React.ReactNode
  pipelineHighlight?: number
}

const examples: Example[] = [
  {
    label: 'Simple Text',
    jsx: `<Text color="green">Hello</Text>
<Text> World</Text>`,
    rendered: (
      <div style={{ display: 'flex', gap: 0 }}>
        <span style={{ color: s.green }}>Hello</span>
        <span style={{ color: s.text }}> World</span>
      </div>
    ),
  },
  {
    label: 'Flexbox Layout',
    jsx: `<Box flexDirection="column">
  <Text>Line 1</Text>
  <Text>Line 2</Text>
</Box>`,
    rendered: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: s.text }}>Line 1</span>
        <span style={{ color: s.text }}>Line 2</span>
      </div>
    ),
  },
  {
    label: 'Nested Boxes',
    jsx: `<Box borderStyle="round">
  <Text padding={1}>Content</Text>
</Box>`,
    rendered: (
      <div style={{
        border: `1px solid ${s.border2}`,
        borderRadius: 6,
        padding: '6px 12px',
        display: 'inline-block',
      }}>
        <span style={{ color: s.text }}>Content</span>
      </div>
    ),
  },
]

const pipelineStages = [
  { label: 'React Tree', color: s.accent },
  { label: 'Yoga Layout', color: s.purple },
  { label: 'Frame Buffer', color: s.orange },
  { label: 'ANSI Diff', color: s.yellow },
  { label: 'Terminal', color: s.green },
]

function PipelineViz({ activeStage }: { activeStage: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 20 }}>
      {pipelineStages.map((stage, idx) => {
        const isActive = idx <= activeStage
        const isCurrent = idx === activeStage
        return (
          <div key={stage.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: s.mono,
              fontWeight: 600,
              color: isActive ? stage.color : s.text3,
              backgroundColor: isActive ? `${stage.color}18` : 'transparent',
              border: `1px solid ${isActive ? `${stage.color}40` : s.border}`,
              transition: 'all 0.4s ease',
              boxShadow: isCurrent ? `0 0 12px ${stage.color}30` : 'none',
            }}>
              {stage.label}
            </div>
            {idx < pipelineStages.length - 1 && (
              <div style={{
                width: 28,
                height: 1,
                backgroundColor: isActive ? s.text3 : s.border,
                transition: 'background-color 0.4s ease',
                margin: '0 2px',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TerminalOutput({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#0d0f12',
      borderRadius: 8,
      border: `1px solid ${s.border}`,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderBottom: `1px solid ${s.border}`,
        backgroundColor: '#0a0b0e',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e85d5d' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e0b040' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3dd68c' }} />
        <span style={{
          marginLeft: 8,
          fontSize: 11,
          fontFamily: s.mono,
          color: s.text3,
        }}>terminal</span>
      </div>
      <div style={{
        padding: '16px 20px',
        fontFamily: s.mono,
        fontSize: 15,
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div style={{
      backgroundColor: s.bg2,
      borderRadius: 8,
      border: `1px solid ${s.border}`,
      padding: '14px 16px',
      fontFamily: s.mono,
      fontSize: 13,
      lineHeight: 1.6,
      color: s.text,
      whiteSpace: 'pre',
      overflow: 'auto',
    }}>
      {code.split('\n').map((line, idx) => (
        <div key={idx} style={{ display: 'flex' }}>
          <span style={{
            color: s.text3,
            width: 28,
            flexShrink: 0,
            userSelect: 'none',
            textAlign: 'right',
            marginRight: 16,
          }}>{idx + 1}</span>
          <span>{highlightJsx(line)}</span>
        </div>
      ))}
    </div>
  )
}

function highlightJsx(line: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = line
  let key = 0

  const tokenRegex = /(<\/?)([\w.]+)([\s\S]*?)(\/?>)|(&quot;|&#39;|&lt;|&gt;|&amp;)|("([^"]*)")|(\{[^}]*\})|([\w-]+)/g

  let match: RegExpExecArray | null
  let lastIdx = 0

  while ((match = tokenRegex.exec(remaining)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={key++}>{remaining.slice(lastIdx, match.index)}</span>)
    }

    if (match[2]) {
      const bracket = match[1]
      const tag = match[2]
      const attrs = match[3]
      const close = match[4]
      parts.push(<span key={key++} style={{ color: s.red }}>{bracket}{tag}</span>)
      if (attrs) {
        parts.push(<span key={key++} style={{ color: s.yellow }}>{attrs}</span>)
      }
      if (close) {
        parts.push(<span key={key++} style={{ color: s.red }}>{close}</span>)
      }
    } else if (match[5]) {
      parts.push(<span key={key++} style={{ color: s.orange }}>{match[5]}</span>)
    } else if (match[6]) {
      parts.push(<span key={key++} style={{ color: s.green }}>{match[6]}</span>)
    } else if (match[8]) {
      parts.push(<span key={key++} style={{ color: s.orange }}>{match[8]}</span>)
    } else if (match[9]) {
      parts.push(<span key={key++}>{match[9]}</span>)
    }

    lastIdx = match.index + match[0].length
  }

  if (lastIdx < remaining.length) {
    parts.push(<span key={key++}>{remaining.slice(lastIdx)}</span>)
  }

  return parts
}

export default function InkRenderingDemo() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [animStage, setAnimStage] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const current = examples[activeIdx]

  const animatePipeline = useCallback((targetStage: number) => {
    setAnimStage(-1)
    let st = -1
    const advance = () => {
      st++
      if (st <= targetStage) {
        setAnimStage(st)
        setTimeout(advance, getStepDelay(300, speed))
      }
    }
    setTimeout(advance, getStepDelay(150, speed))
  }, [speed])

  useEffect(() => {
    animatePipeline(4)
  }, [activeIdx, animatePipeline])

  return (
    <div style={{
      maxWidth: 820,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {examples.map((ex, idx) => (
          <button
            key={ex.label}
            onClick={() => setActiveIdx(idx)}
            style={{
              padding: '7px 18px',
              borderRadius: 6,
              border: `1px solid ${idx === activeIdx ? s.accent : s.border}`,
              backgroundColor: idx === activeIdx ? `${s.accent}18` : 'transparent',
              color: idx === activeIdx ? s.accent : s.text2,
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: idx === activeIdx ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {ex.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <div>
          <div style={{
            fontSize: 11,
            fontFamily: s.mono,
            color: s.text3,
            marginBottom: 8,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            JSX Source
          </div>
          <CodeBlock code={current.jsx} />
        </div>
        <div>
          <div style={{
            fontSize: 11,
            fontFamily: s.mono,
            color: s.text3,
            marginBottom: 8,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Terminal Output
          </div>
          <TerminalOutput>
            {current.rendered}
          </TerminalOutput>
        </div>
      </div>

      <div style={{
        marginTop: 4,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: s.mono,
          color: s.text3,
          marginBottom: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Render Pipeline
        </div>
        <PipelineViz activeStage={animStage} />
      </div>
    </div>
  )
}

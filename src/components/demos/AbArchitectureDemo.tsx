import { useState, useCallback, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Service {
  id: string
  label: string
  x: number
  y: number
  color: string
}

const services: Service[] = [
  { id: 'client', label: 'Client', x: 60, y: 100, color: s.text },
  { id: 'flags', label: 'Feature Flag\nService', x: 220, y: 100, color: s.accent },
  { id: 'expconfig', label: 'Experiment\nConfig', x: 380, y: 100, color: s.purple },
  { id: 'assign', label: 'Assignment\nService', x: 540, y: 100, color: s.orange },
  { id: 'analytics', label: 'Analytics\nPipeline', x: 540, y: 250, color: s.green },
  { id: 'storage', label: 'Metric\nStorage', x: 380, y: 250, color: s.yellow },
  { id: 'analysis', label: 'Analysis\nService', x: 220, y: 250, color: s.red },
  { id: 'dashboard', label: 'Results\nDashboard', x: 60, y: 250, color: s.text2 },
]

const edges = [
  { from: 'client', to: 'flags' },
  { from: 'flags', to: 'expconfig' },
  { from: 'expconfig', to: 'assign' },
  { from: 'assign', to: 'analytics' },
  { from: 'analytics', to: 'storage' },
  { from: 'storage', to: 'analysis' },
  { from: 'analysis', to: 'dashboard' },
  { from: 'assign', to: 'client' },
]

const edgeColors: Record<string, string> = {
  'client->flags': s.accent,
  'flags->expconfig': s.purple,
  'expconfig->assign': s.orange,
  'assign->analytics': s.green,
  'analytics->storage': s.yellow,
  'storage->analysis': s.red,
  'analysis->dashboard': s.text2,
  'assign->client': s.accent,
}

const edgeLabels: Record<string, string> = {
  'client->flags': 'check flag',
  'flags->expconfig': 'get config',
  'expconfig->assign': 'resolve variant',
  'assign->analytics': 'log event',
  'analytics->storage': 'write',
  'storage->analysis': 'aggregate',
  'analysis->dashboard': 'report',
  'assign->client': 'variant + config',
}

const STEP_FLOW: { step: number; edge: string; desc: string; detail: string }[] = [
  { step: 1, edge: 'client->flags', desc: 'Request enters with user_id', detail: 'User visits page or calls API. SDK sends user_id, experiment_id, and context (browser, region, plan_tier). Feature flag service checks if the experiment is active and if the user is targeted.' },
  { step: 2, edge: 'flags->expconfig', desc: 'Lookup experiment configuration', detail: 'Feature flag service fetches experiment config from the config store: traffic split percentages, variants, start/end dates, targeting rules, and mutually exclusive groups.' },
  { step: 3, edge: 'expconfig->assign', desc: 'Assign user to variant', detail: 'Assignment service computes hash(user_id + experiment_id) % 100 to get a deterministic bucket, then maps that bucket to control or treatment. Result is cached to ensure sticky assignments.' },
  { step: 4, edge: 'assign->client', desc: 'Return variant assignment', detail: 'The assigned variant (control or treatment) is returned to the client along with any feature flag overrides. Client renders the corresponding UI or applies the backend logic.' },
  { step: 5, edge: 'assign->analytics', desc: 'Emit exposure + conversion events', detail: 'Assignment service emits an "exposure" event (user was shown this variant). The client or server emits "conversion" events (user performed the target action). Both flow into the analytics pipeline.' },
  { step: 6, edge: 'analytics->storage', desc: 'Ingest, validate, batch-write events', detail: 'Analytics pipeline validates schema, deduplicates, enriches with metadata, and batch-writes to metric storage (e.g., ClickHouse, Parquet on S3). Raw events are stored for reprocessing.' },
  { step: 7, edge: 'storage->analysis', desc: 'Aggregate metrics per variant per day', detail: 'Analysis service queries metric storage to compute per-variant metrics: conversion rate, mean/std revenue, retention. Applies frequentist or Bayesian statistics to compute p-values and confidence intervals.' },
  { step: 8, edge: 'analysis->dashboard', desc: 'Display results with statistical verdict', detail: 'Results dashboard shows conversion rates, lift, p-value, confidence intervals, and significance status. Supports slicing by date, segment, and secondary metrics.' },
]

const STEP_MAP: Record<string, number> = {}
STEP_FLOW.forEach((st, i) => { STEP_MAP[st.edge] = i })

function getEdgeKey(from: string, to: string) { return `${from}->${to}` }

export default function AbArchitectureDemo() {
  const [currentStep, setCurrentStep] = useState(-1)
  const [autoPlay, setAutoPlay] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= STEP_FLOW.length - 1) {
            setAutoPlay(false)
            return prev
          }
          return prev + 1
        })
      }, 1800)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoPlay])

  const handleAutoPlay = useCallback(() => {
    if (autoPlay) {
      setAutoPlay(false)
    } else {
      if (currentStep >= STEP_FLOW.length - 1) {
        setCurrentStep(-1)
      }
      setAutoPlay(true)
    }
  }, [autoPlay, currentStep])

  const reset = () => {
    setAutoPlay(false)
    setCurrentStep(-1)
  }

  const W = 640
  const H = 340

  const activeEdge = currentStep >= 0 ? STEP_FLOW[currentStep]?.edge : null
  const activeInfo = currentStep >= 0 ? STEP_FLOW[currentStep] : null

  return (
    <DemoBoundary name="A/B Testing Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        A/B Testing Architecture
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
        Trace a user request through the full experiment pipeline: flag check, variant assignment, event tracking, and results analysis.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={reset} style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
          color: s.text2, cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
        }}>
          Reset
        </button>
        <button onClick={handleAutoPlay} style={{
          background: autoPlay ? s.red : s.green, border: 'none', borderRadius: 6, padding: '6px 14px',
          color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600,
        }}>
          {autoPlay ? 'Stop' : currentStep >= STEP_FLOW.length - 1 ? 'Replay' : 'Auto Play'}
        </button>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {STEP_FLOW.map((st, i) => (
            <button
              key={st.step}
              onClick={() => { setAutoPlay(false); setCurrentStep(i) }}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1px solid ${i <= currentStep ? s.accent : s.border}`,
                background: i <= currentStep ? s.accent + '22' : 'transparent',
                color: i <= currentStep ? s.accent : s.text3,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {st.step}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 16, marginBottom: 16, overflow: 'hidden',
      }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {edges.map(edge => {
            const from = services.find(sv => sv.id === edge.from)!
            const to = services.find(sv => sv.id === edge.to)!
            const key = getEdgeKey(edge.from, edge.to)
            const isActive = activeEdge === key
            return (
              <g key={key}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isActive ? edgeColors[key] : s.border2}
                  strokeWidth={isActive ? 3 : 1.5}
                  strokeOpacity={isActive ? 1 : 0.4}
                  strokeLinecap="round"
                  style={{ transition: 'all 0.3s' }}
                />
                {isActive && (
                  <circle r={5} fill={edgeColors[key]}>
                    <animateMotion dur="1.2s" repeatCount="indefinite"
                      path={`M${from.x},${from.y} L${to.x},${to.y}`} />
                  </circle>
                )}
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 8}
                  textAnchor="middle"
                  fill={isActive ? edgeColors[key] : s.text3}
                  fontSize={9}
                  opacity={isActive ? 1 : 0.5}
                  style={{ transition: 'all 0.3s' }}
                >
                  {edgeLabels[key]}
                </text>
              </g>
            )
          })}

          {services.map(sv => {
            const isSource = activeInfo && (activeInfo.edge.startsWith(sv.id) || activeInfo.edge.endsWith(sv.id))
            return (
              <g key={sv.id}>
                <rect
                  x={sv.x - 50} y={sv.y - 22}
                  width={100} height={44} rx={10}
                  fill={isSource ? sv.color + '33' : s.bg3}
                  stroke={isSource ? sv.color : s.border}
                  strokeWidth={isSource ? 2.5 : 1}
                  style={{ transition: 'all 0.3s' }}
                />
                {sv.label.split('\n').map((line, i) => (
                  <text
                    key={i}
                    x={sv.x} y={sv.y + (i === 0 ? -6 : 8)}
                    textAnchor="middle"
                    fill={isSource ? sv.color : s.text2}
                    fontSize={11}
                    fontWeight={isSource ? 700 : 400}
                    style={{ transition: 'all 0.3s' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      {activeInfo && (
        <div style={{
          background: s.bg3, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: s.accent, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {activeInfo.step}
            </div>
            <div style={{ color: s.text, fontSize: 15, fontWeight: 600 }}>
              {activeInfo.desc}
            </div>
          </div>
          <p style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {activeInfo.detail}
          </p>
        </div>
      )}

      {currentStep < 0 && (
        <div style={{
          padding: 14, background: s.bg3, borderRadius: 10, border: `1px solid ${s.border}`,
          color: s.text3, fontSize: 13, textAlign: 'center',
        }}>
          Click a step number or press Auto Play to trace the request flow through the architecture.
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}

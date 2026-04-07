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

type Context = 'lock' | 'fork'

const configs: Record<Context, { compression: number; head: number; kl: number; retained: number }> = {
  lock: { compression: 70, head: 15, kl: 15, retained: 2 },
  fork: { compression: 35, head: 40, kl: 25, retained: 6 },
}

export default function DistributionReshapeDemo() {
  const [ctx, setCtx] = useState<Context>('lock')
  const cfg = configs[ctx]
  const isLock = ctx === 'lock'

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['lock', 'fork'] as Context[]).map((c) => (
          <button
            key={c}
            onClick={() => setCtx(c)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: `1px solid ${ctx === c ? s.accent : s.border}`,
              borderRadius: 8,
              background: ctx === c ? 'rgba(91,141,239,0.12)' : s.bg2,
              color: ctx === c ? s.accent : s.text2,
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: 0.3,
            }}
          >
            {c === 'lock' ? 'Lock context' : 'Fork context'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: s.text3, fontFamily: s.mono, display: 'flex', justifyContent: 'space-between' }}>
            <span>SSD Loss Decomposition</span>
            <span>Retained support: {cfg.retained} tokens</span>
          </div>

          <div style={{ display: 'flex', height: 44, borderRadius: 8, overflow: 'hidden', background: s.bg2 }}>
            {[
              { pct: cfg.compression, color: s.accent, label: 'Support Compression', sub: 'Removes tail mass', key: 'compression' },
              { pct: cfg.head, color: s.purple, label: 'Head Reshaping', sub: 'Redistributes within retained support', key: 'head' },
              { pct: cfg.kl, color: s.green, label: 'KL Anchor', sub: 'Aligns with teacher preferences', key: 'kl' },
            ].map((seg) => (
              <div
                key={seg.key}
                style={{
                  width: `${seg.pct}%`,
                  background: seg.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  minWidth: 30,
                }}
              >
                <span style={{
                  fontSize: seg.pct >= 20 ? 12 : 10,
                  fontWeight: 700,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}>
                  {seg.pct}%
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', marginTop: 6, gap: 4 }}>
            {[
              { color: s.accent, label: 'Support Compression', sub: 'Removes tail mass' },
              { color: s.purple, label: 'Head Reshaping', sub: 'Redistributes within retained support' },
              { color: s.green, label: 'KL Anchor', sub: 'Aligns with teacher preferences' },
            ].map((leg) => (
              <div key={leg.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: s.text2, fontWeight: 600, lineHeight: 1.2 }}>{leg.label}</div>
                  <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.2 }}>{leg.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: s.bg2,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontFamily: s.mono,
            fontSize: 12,
            color: s.text2,
            lineHeight: 1.8,
          }}>
            <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Objective</div>
            <span style={{ color: s.accent }}>L_SSD</span>
            {' = '}
            <span style={{ color: s.accent }}>-log(KeptMass)</span>
            {' + '}
            <span style={{ color: s.purple }}>(1-T)*H_1/T(p|S)</span>
            {' + '}
            <span style={{ color: s.green }}>D_KL(q || p^T|S)</span>
          </div>

          <div style={{
            marginTop: 12,
            padding: '12px 16px',
            background: isLock ? 'rgba(91,141,239,0.08)' : 'rgba(155,123,234,0.08)',
            borderRadius: 8,
            border: `1px solid ${isLock ? 'rgba(91,141,239,0.2)' : 'rgba(155,123,234,0.2)'}`,
            fontSize: 13,
            color: s.text2,
            lineHeight: 1.5,
          }}>
            {isLock
              ? 'Lock position retains only 2 tokens. The -log(KeptMass) term dominates, meaning most of the learning signal goes into deciding which tokens to drop.'
              : 'Fork position retains 6 tokens. The head reshaping term dominates, meaning most of the learning signal goes into redistributing probability among kept tokens.'}
          </div>
        </div>

        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              label: 'Lock: support compression dominates',
              color: s.accent,
              bg: 'rgba(91,141,239,0.08)',
              border: 'rgba(91,141,239,0.2)',
              active: isLock,
              arrow: '\u25B6',
            },
            {
              label: 'Fork: head reshaping has room',
              color: s.purple,
              bg: 'rgba(155,123,234,0.08)',
              border: 'rgba(155,123,234,0.2)',
              active: !isLock,
              arrow: '\u25B6',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '12px 14px',
                background: item.active ? item.bg : s.bg2,
                border: `1px solid ${item.active ? item.border : s.border}`,
                borderRadius: 8,
                transition: 'all 0.3s ease',
                opacity: item.active ? 1 : 0.45,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: item.active ? item.color : s.text3, marginBottom: 8, lineHeight: 1.3 }}>
                {item.label}
              </div>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {configs.lock.compression > 0 && (
                  <div style={{ width: `${configs.lock.compression}%`, height: 14, background: s.accent, borderRadius: 2, opacity: item.active && isLock ? 1 : 0.3, transition: 'opacity 0.3s' }} />
                )}
                {configs.lock.head > 0 && (
                  <div style={{ width: `${configs.lock.head}%`, height: 14, background: s.purple, borderRadius: 2, opacity: item.active && !isLock ? 1 : 0.3, transition: 'opacity 0.3s' }} />
                )}
                {configs.lock.kl > 0 && (
                  <div style={{ width: `${configs.lock.kl}%`, height: 14, background: s.green, borderRadius: 2, opacity: 0.2, transition: 'opacity 0.3s' }} />
                )}
              </div>
              <div style={{ fontSize: 10, color: s.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{item.arrow}</span>
                <span style={{ color: item.color, fontWeight: 600 }}>
                  {isLock ? '70%' : '40%'} {isLock ? 'blue' : 'purple'}
                </span>
              </div>
            </div>
          ))}

          <div style={{
            padding: '12px 14px',
            background: s.bg2,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 6, fontWeight: 600 }}>Key Insight</div>
            <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
              The same objective produces different effects at different positions based on how many tokens survive truncation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

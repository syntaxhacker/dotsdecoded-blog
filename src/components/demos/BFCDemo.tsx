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

type BFCMode = 'none' | 'overflow-hidden' | 'flow-root'

function BFCDemo() {
  const [tab, setTab] = useState<'floats' | 'margin'>('floats')
  const [bfc, setBfc] = useState<BFCMode>('none')

  return (
    <DemoBoundary name="Block Formatting Context">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['floats', 'margin'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setBfc('none') }}
              style={{
                padding: '6px 14px',
                background: tab === t ? s.accent + '22' : s.bg2,
                border: `1px solid ${tab === t ? s.accent : s.border}`,
                borderRadius: 5,
                color: tab === t ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {t === 'floats' ? 'Contains Floats' : 'Prevents Margin Collapse'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { key: 'none' as BFCMode, label: 'No BFC', color: s.red },
            { key: 'overflow-hidden' as BFCMode, label: 'overflow: hidden', color: s.orange },
            { key: 'flow-root' as BFCMode, label: 'display: flow-root', color: s.green },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setBfc(item.key)}
              style={{
                padding: '6px 12px',
                background: bfc === item.key ? item.color + '22' : s.bg2,
                border: `1px solid ${bfc === item.key ? item.color : s.border}`,
                borderRadius: 5,
                color: bfc === item.key ? item.color : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border2}`,
              borderRadius: 6,
              padding: 4,
              minHeight: 180,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, padding: '4px 8px' }}>
                .wrapper
              </div>
              <div style={{
                background: s.bg2,
                border: `2px solid ${bfc === 'none' ? s.red : s.green}`,
                borderRadius: 4,
                padding: 8,
                position: 'relative',
                minHeight: bfc === 'none' && tab === 'floats' ? 0 : undefined,
                overflow: bfc === 'overflow-hidden' ? 'hidden' : undefined,
                display: bfc === 'flow-root' ? 'flow-root' : undefined,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, marginBottom: 4 }}>
                  .parent {bfc === 'none' ? '' : bfc === 'overflow-hidden' ? '(overflow: hidden)' : '(display: flow-root)'}
                </div>

                {tab === 'floats' && (
                  <div style={{
                    float: 'left',
                    width: 120,
                    height: 60,
                    background: s.accent + '22',
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.accent,
                  }}>
                    float: left
                  </div>
                )}

                {tab === 'margin' && (
                  <div style={{
                    margin: bfc === 'none' ? 30 : 30,
                    background: s.accent + '22',
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    padding: '8px 12px',
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.accent,
                  }}>
                    .child (margin: 30px)
                  </div>
                )}

                {bfc === 'none' && (
                  <div style={{
                    position: 'absolute',
                    bottom: -20,
                    left: 8,
                    fontFamily: s.mono,
                    fontSize: 9,
                    color: s.red,
                    whiteSpace: 'nowrap',
                  }}>
                    {tab === 'floats' ? 'parent collapsed!' : 'margin collapsed with parent'}
                  </div>
                )}
              </div>

              {tab === 'floats' && bfc !== 'none' && (
                <div style={{
                  fontFamily: s.mono,
                  fontSize: 9,
                  color: s.green,
                  padding: '4px 8px',
                }}>
                  Parent contains the float correctly.
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              padding: 14,
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>
                {tab === 'floats' ? 'CONTAINS FLOATS' : 'PREVENTS MARGIN COLLAPSE'}
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
                {tab === 'floats'
                  ? 'Without a BFC, a parent with only floated children collapses to zero height. The float overflows visibly. Creating a BFC forces the parent to expand and contain its floated children.'
                  : 'Adjacent vertical margins between parent and child normally collapse to the larger value. A BFC on the parent prevents this — both margins are applied independently.'}
              </div>
            </div>

            <div style={{
              padding: 14,
              background: bfc === 'none' ? s.red + '10' : s.green + '10',
              border: `1px solid ${bfc === 'none' ? s.red : s.green}`,
              borderRadius: 6,
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: bfc === 'none' ? s.red : s.green, fontWeight: 600 }}>
                {bfc === 'none' ? 'No BFC — problem visible' : 'BFC created — problem solved'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { prop: 'overflow: hidden', note: 'Clips content — side effect' },
                { prop: 'overflow: auto', note: 'Scrollbars if needed — side effect' },
                { prop: 'display: flow-root', note: 'No side effects — recommended' },
                { prop: 'float: left/right', note: 'Changes layout — side effect' },
                { prop: 'position: absolute/fixed', note: 'Removes from flow — side effect' },
              ].map((item) => (
                <div key={item.prop} style={{
                  padding: '5px 10px',
                  background: s.bg2,
                  borderRadius: 4,
                  border: `1px solid ${s.border}`,
                  fontFamily: s.mono,
                  fontSize: 10,
                }}>
                  <span style={{ color: s.yellow }}>{item.prop}</span>
                  <span style={{ color: s.text3 }}> — {item.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default BFCDemo

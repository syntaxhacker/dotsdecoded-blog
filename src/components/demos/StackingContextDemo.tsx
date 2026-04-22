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

function StackingContextDemo() {
  const [showIsolation, setShowIsolation] = useState(false)
  const [parentOpacity, setParentOpacity] = useState(1)
  const [childZIndex, setChildZIndex] = useState(10)

  return (
    <DemoBoundary name="Stacking Context">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowIsolation(!showIsolation)}
            style={{
              padding: '6px 14px',
              background: showIsolation ? s.green + '22' : s.bg2,
              border: `1px solid ${showIsolation ? s.green : s.border}`,
              borderRadius: 5,
              color: showIsolation ? s.green : s.text2,
              fontFamily: s.mono,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            isolation: {showIsolation ? 'isolate' : 'normal'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>Parent opacity:</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={parentOpacity}
              onChange={(e) => setParentOpacity(Number(e.target.value))}
              style={{ width: 80, accentColor: s.accent, height: 4 }}
            />
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.accent }}>{parentOpacity}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>Child z-index:</span>
            <input
              type="range"
              min={1}
              max={20}
              value={childZIndex}
              onChange={(e) => setChildZIndex(Number(e.target.value))}
              style={{ width: 80, accentColor: s.green, height: 4 }}
            />
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.green }}>{childZIndex}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: 4,
              position: 'relative',
              height: 200,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, padding: '4px 8px' }}>
                .root-stacking-context
              </div>

              <div style={{
                position: 'absolute',
                top: 30,
                left: 8,
                right: 8,
                bottom: 30,
                background: s.green + '12',
                border: `2px solid ${s.green}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: s.mono,
                fontSize: 11,
                color: s.green,
                zIndex: 2,
              }}>
                .sibling (z-index: 2)
              </div>

              <div style={{
                position: 'absolute',
                top: 50,
                left: 20,
                width: 220,
                height: 120,
                background: s.accent + '18',
                border: `2px solid ${s.accent}`,
                borderRadius: 4,
                zIndex: 1,
                opacity: showIsolation || parentOpacity < 1 ? parentOpacity : 1,
                isolation: showIsolation ? 'isolate' : undefined,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 9, color: s.accent, padding: '4px 8px' }}>
                  .parent (z-index: 1)
                  {showIsolation && ' + isolation: isolate'}
                  {parentOpacity < 1 && !showIsolation && ' + opacity < 1'}
                  {showIsolation || parentOpacity < 1 ? ' [NEW STACKING CTX]' : ''}
                </div>

                <div style={{
                  position: 'absolute',
                  top: 30,
                  left: 10,
                  right: 10,
                  bottom: 10,
                  background: s.yellow + '22',
                  border: `2px solid ${s.yellow}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.yellow,
                  zIndex: childZIndex,
                }}>
                  .child (z-index: {childZIndex})
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: (showIsolation || parentOpacity < 1) ? s.red + '10' : s.green + '10',
              border: `1px solid ${(showIsolation || parentOpacity < 1) ? s.red : s.green}`,
              borderRadius: 5,
              fontFamily: s.mono,
              fontSize: 11,
              color: (showIsolation || parentOpacity < 1) ? s.red : s.green,
            }}>
              {(showIsolation || parentOpacity < 1)
                ? `.child (z-index:${childZIndex}) is BEHIND .sibling (z-index:2)!`
                : `.child (z-index:${childZIndex}) appears ON TOP of .sibling (z-index:2)`}
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
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>THE BUG</div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
                .parent has z-index: 1 and .sibling has z-index: 2. The sibling renders above the parent's entire stacking context.
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginTop: 6 }}>
                Even though .child has z-index: {childZIndex}, it can never escape its parent's stacking context. The child's z-index only competes with other children inside .parent.
              </div>
            </div>

            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 6 }}>WHAT CREATES A STACKING CONTEXT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                'position: absolute/relative/fixed + z-index (not auto)',
                'opacity < 1',
                'transform: translateX(0)',
                'isolation: isolate',
                'will-change: transform, opacity',
                'filter: blur(0px)',
                'mix-blend-mode: multiply',
                'contain: layout / paint',
              ].map((item) => (
                <div key={item} style={{
                  padding: '4px 10px',
                  background: s.bg2,
                  borderRadius: 3,
                  border: `1px solid ${s.border}`,
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.text2,
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default StackingContextDemo

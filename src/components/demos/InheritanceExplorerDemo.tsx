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

const inheritedProps = [
  { name: 'color', value: '#e85d5d', label: 'color: red' },
  { name: 'font-family', value: 'monospace', label: 'font-family: monospace' },
  { name: 'font-size', value: '18px', label: 'font-size: 18px' },
  { name: 'line-height', value: '1.8', label: 'line-height: 1.8' },
  { name: 'text-align', value: 'center', label: 'text-align: center' },
]

const nonInheritedProps = [
  { name: 'margin', value: '12px', label: 'margin: 12px' },
  { name: 'padding', value: '12px', label: 'padding: 12px' },
  { name: 'border', value: '2px solid', label: 'border: 2px solid' },
  { name: 'width', value: '180px', label: 'width: 180px' },
  { name: 'background', value: '#15191e', label: 'background: #15191e' },
]

type ActiveProp = { name: string; value: string; inherited: boolean } | null

function InheritanceExplorerDemo() {
  const [activeProp, setActiveProp] = useState<ActiveProp>(null)

  const getStyle = (depth: number) => {
    const base: React.CSSProperties = {
      borderRadius: 6,
      transition: 'all 0.3s ease',
    }
    if (!activeProp) return { ...base, border: `1px solid ${s.border}`, padding: 12 + depth * 4 }
    if (activeProp.inherited || depth === 0) {
      return { ...base, border: `1px solid ${s.border}`, padding: 12 + depth * 4 }
    }
    const reset: React.CSSProperties = { border: 'none', padding: 0, margin: 0, background: 'transparent', width: 'auto' }
    if (activeProp.name === 'color') return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4, color: s.text }
    if (activeProp.name === 'font-family') return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4, fontFamily: 'inherit' }
    if (activeProp.name === 'font-size') return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4, fontSize: 'inherit' }
    if (activeProp.name === 'line-height') return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4, lineHeight: 'inherit' }
    if (activeProp.name === 'text-align') return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4, textAlign: 'inherit' as React.CSSProperties['textAlign'] }
    return { ...base, ...reset, border: `1px solid ${s.border}`, padding: 12 + depth * 4 }
  }

  return (
    <DemoBoundary name="Inheritance Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 10 }}>CLICK A PROPERTY TO TOGGLE</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ color: s.green, fontSize: 11, fontFamily: s.mono, marginBottom: 6, fontWeight: 600 }}>INHERITS (passes to children)</div>
              {inheritedProps.map((prop) => (
                <button
                  key={prop.name}
                  onClick={() => setActiveProp(activeProp?.name === prop.name ? null : { ...prop, inherited: true })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    marginBottom: 4,
                    background: activeProp?.name === prop.name ? s.green + '22' : s.bg2,
                    border: `1px solid ${activeProp?.name === prop.name ? s.green : s.border}`,
                    borderRadius: 4,
                    color: s.text2,
                    fontFamily: s.mono,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: s.green, marginRight: 8 }}>INH</span>
                  {prop.label}
                </button>
              ))}
            </div>

            <div>
              <div style={{ color: s.red, fontSize: 11, fontFamily: s.mono, marginBottom: 6, fontWeight: 600 }}>DOES NOT INHERIT</div>
              {nonInheritedProps.map((prop) => (
                <button
                  key={prop.name}
                  onClick={() => setActiveProp(activeProp?.name === prop.name ? null : { ...prop, inherited: false })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    marginBottom: 4,
                    background: activeProp?.name === prop.name ? s.red + '22' : s.bg2,
                    border: `1px solid ${activeProp?.name === prop.name ? s.red : s.border}`,
                    borderRadius: 4,
                    color: s.text2,
                    fontFamily: s.mono,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: s.red, marginRight: 8 }}>OWN</span>
                  {prop.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 10 }}>DOM TREE</div>

            <div style={{
              ...getStyle(0),
              background: activeProp && activeProp.inherited ? s.bg2 : s.bg2,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, marginBottom: 4 }}>div.parent</div>
              <div style={{ fontSize: 13, color: s.text2, marginBottom: 8 }}>Parent element with styles applied</div>

              <div style={{ ...getStyle(1), background: activeProp && activeProp.inherited ? s.bg2 : 'transparent' }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, marginBottom: 4 }}>div.child</div>
                <div style={{ fontSize: 13, color: s.text2, marginBottom: 8 }}>Child element</div>

                <div style={{ ...getStyle(2), background: activeProp && activeProp.inherited ? s.bg2 : 'transparent' }}>
                  <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, marginBottom: 4 }}>span.grandchild</div>
                  <div style={{ fontSize: 13, color: s.text2 }}>Grandchild element</div>
                </div>
              </div>
            </div>

            {activeProp && (
              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                background: activeProp.inherited ? s.green + '15' : s.red + '15',
                border: `1px solid ${activeProp.inherited ? s.green : s.red}`,
                borderRadius: 6,
                fontSize: 13,
                color: s.text2,
                lineHeight: 1.5,
              }}>
                <span style={{ fontFamily: s.mono, color: activeProp.inherited ? s.green : s.red }}>
                  {activeProp.name}
                </span>
                {' '}{activeProp.inherited ? 'is inherited' : 'is NOT inherited'}.
                {activeProp.inherited
                  ? ' Children automatically receive this value from their parent.'
                  : ' Each element must set this property independently.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default InheritanceExplorerDemo

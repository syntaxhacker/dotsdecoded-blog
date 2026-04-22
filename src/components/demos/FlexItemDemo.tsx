import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const colors = [s.accent, s.green, s.yellow, s.purple, s.orange, s.red, '#8be9fd', '#ffb86c']

interface Item {
  id: number
  grow: number
  shrink: number
  basis: string
}

export default function FlexItemDemo() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, grow: 0, shrink: 1, basis: 'auto' },
    { id: 2, grow: 1, shrink: 1, basis: 'auto' },
    { id: 3, grow: 0, shrink: 1, basis: 'auto' },
  ])

  const updateItem = (id: number, key: keyof Item, val: number | string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: val } : it))
  }

  const addItem = () => {
    setItems(prev => [...prev, { id: Math.max(0, ...prev.map(it => it.id)) + 1, grow: 0, shrink: 1, basis: 'auto' }])
  }

  const removeItem = () => {
    setItems(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }

  return (
    <DemoBoundary name="Flex Item Properties">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={addItem} style={btnStyle}>Add Item</button>
          <button onClick={removeItem} style={btnStyle}>Remove Item</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{
              flex: 1,
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: colors[idx % colors.length],
                marginBottom: 8,
              }} />
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>Item {item.id}</div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, display: 'block', marginBottom: 2 }}>
                  flex-grow: {item.grow}
                </label>
                <input
                  type="range" min={0} max={5} value={item.grow}
                  onChange={e => updateItem(item.id, 'grow', +e.target.value)}
                  style={{ width: '100%', accentColor: colors[idx % colors.length] }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, display: 'block', marginBottom: 2 }}>
                  flex-shrink: {item.shrink}
                </label>
                <input
                  type="range" min={0} max={5} value={item.shrink}
                  onChange={e => updateItem(item.id, 'shrink', +e.target.value)}
                  style={{ width: '100%', accentColor: colors[idx % colors.length] }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, display: 'block', marginBottom: 2 }}>
                  flex-basis
                </label>
                <select
                  value={item.basis}
                  onChange={e => updateItem(item.id, 'basis', e.target.value)}
                  style={{ width: '100%', background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px', fontSize: 10, fontFamily: s.mono }}
                >
                  <option value="auto">auto</option>
                  <option value="0">0</option>
                  <option value="100px">100px</option>
                  <option value="200px">200px</option>
                  <option value="300px">300px</option>
                </select>
              </div>

              <div style={{ marginTop: 8, fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                flex: {item.grow} {item.shrink} {item.basis === '0' ? '0%' : item.basis}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 20, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'stretch',
          }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{
                flexGrow: item.grow,
                flexShrink: item.shrink,
                flexBasis: item.basis === '0' ? '0%' : item.basis,
                background: colors[idx % colors.length],
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.bg,
                fontWeight: 700,
                fontSize: 14,
                fontFamily: s.mono,
                minHeight: 80,
                padding: '8px 16px',
                transition: 'flex-grow 0.3s, flex-shrink 0.3s, flex-basis 0.3s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {item.grow > 0 && (
                  <div style={{
                    position: 'absolute', top: 4, right: 6,
                    background: s.bg, color: s.green, fontSize: 9,
                    fontFamily: s.mono, padding: '1px 5px', borderRadius: 3,
                  }}>
                    grow: {item.grow}
                  </div>
                )}
                {item.id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

const btnStyle: React.CSSProperties = {
  background: s.bg3,
  color: s.text2,
  border: `1px solid ${s.border}`,
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 11,
  fontFamily: s.mono,
  cursor: 'pointer',
}

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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }

interface DescriptorInfo {
  name: string
  color: string
  decorator: string
  protocolCall: string
  explanation: string
}

const descriptors: DescriptorInfo[] = [
  {
    name: '@property',
    color: s.accent,
    decorator: '@property',
    protocolCall: "property.__get__(obj, type(obj))",
    explanation: 'property is a descriptor. Its __get__ calls the getter function. __set__ (if defined) calls the setter. This is how obj.name becomes a method call without explicit invocation.',
  },
  {
    name: '@staticmethod',
    color: s.green,
    decorator: '@staticmethod',
    protocolCall: "staticmethod.__get__(obj, type(obj))",
    explanation: 'staticmethod is a descriptor whose __get__ returns the raw function unchanged. No self or cls is bound. It behaves like a plain function namespaced inside the class.',
  },
  {
    name: '@classmethod',
    color: s.orange,
    decorator: '@classmethod',
    protocolCall: "classmethod.__get__(obj, type(obj))",
    explanation: 'classmethod is a descriptor whose __get__ binds the method to the class (cls), not the instance. When called, the first argument is the class itself, not the instance.',
  },
  {
    name: 'custom Validator',
    color: s.purple,
    decorator: 'class Validator:',
    protocolCall: "Validator.__get__(obj, type(obj))",
    explanation: 'Any class implementing __get__, __set__, or __delete__ is a descriptor. This powers frameworks like Django and SQLAlchemy where field access triggers validation or database queries.',
  },
]

const mroChain = [
  { name: 'MyClass', color: s.text },
  { name: 'BaseClass', color: s.text },
  { name: 'Mixin', color: s.text },
  { name: 'object', color: s.text3 },
]

export default function PythonDescriptorDemo() {
  const [selected, setSelected] = useState<DescriptorInfo | null>(null)
  const [showMro, setShowMro] = useState(false)
  const [mroHighlight, setMroHighlight] = useState<number | null>(null)

  const handleAttrClick = (attr: string) => {
    const desc = descriptors.find(d => d.name === attr)
    if (desc) {
      setSelected(desc)
      setShowMro(false)
    }
  }

  return (
    <DemoBoundary name="Descriptor Protocol">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Descriptor Protocol</div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Class Definition</div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, fontFamily: s.mono, fontSize: 12, color: s.text, whiteSpace: 'pre', lineHeight: 1.6 }}>
              <span>class MyClass(BaseClass, Mixin):</span>
              {'\n'}
              <span>    @property</span>
              {'\n'}
              <span style={{ cursor: 'pointer' }} onClick={() => handleAttrClick('@property')}>    def name(self):</span>
              {'\n'}
              <span>        return self._name</span>
              {'\n'}
              <span>{'\n'}</span>
              <span>    @staticmethod</span>
              {'\n'}
              <span style={{ cursor: 'pointer' }} onClick={() => handleAttrClick('@staticmethod')}>    def util(x):</span>
              {'\n'}
              <span>        return x * 2</span>
              {'\n'}
              <span>{'\n'}</span>
              <span>    @classmethod</span>
              {'\n'}
              <span style={{ cursor: 'pointer' }} onClick={() => handleAttrClick('@classmethod')}>    def create(cls):</span>
              {'\n'}
              <span>        return cls()</span>
              {'\n'}
              <span>{'\n'}</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleAttrClick('custom Validator')}>    name = Validator(maxlen=100)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {descriptors.map(d => {
              const isSelected = selected?.name === d.name
              return (
                <button key={d.name} onClick={() => { setSelected(d); setShowMro(false) }} style={{
                  flex: 1, background: isSelected ? `${d.color}22` : s.bg3,
                  border: `1px solid ${isSelected ? d.color : s.border}`,
                  borderRadius: 8, padding: '6px 10px',
                  color: isSelected ? d.color : s.text2, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                  {d.decorator}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ width: 280, background: s.bg2, borderRadius: 12, padding: 16, minHeight: 180 }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color }} />
                <span style={{ color: selected.color, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{selected.name}</span>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>Protocol call:</div>
                <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 11 }}>{selected.protocolCall}</div>
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
                {selected.explanation}
              </div>
            </>
          ) : (
            <div style={{ color: s.text3, fontSize: 12, fontStyle: 'italic' }}>
              Click a descriptor above to see how it works.
            </div>
          )}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Method Resolution Order (MRO)</span>
          <button onClick={() => { setShowMro(!showMro); setMroHighlight(null); setSelected(null) }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 12px',
            color: showMro ? s.accent : s.text2, cursor: 'pointer', fontSize: 11,
          }}>{showMro ? 'Hide MRO' : 'Show MRO'}</button>
        </div>

        {showMro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {mroChain.map((cls, i) => (
              <button key={cls.name}
                onMouseEnter={() => setMroHighlight(i)}
                onMouseLeave={() => setMroHighlight(null)}
                style={{
                  background: mroHighlight !== null && mroHighlight >= i ? `${s.accent}22` : s.bg,
                  border: `1px solid ${mroHighlight !== null && mroHighlight >= i ? s.accent : s.border}`,
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{ color: cls.color, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>{cls.name}</div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{i === 0 ? 'self' : ''}</div>
              </button>
            ))}
            {mroHighlight !== null && (
              <div style={{ color: s.text2, fontSize: 11, marginLeft: 8 }}>
                Search: {mroChain.slice(0, mroHighlight + 1).map(c => c.name).join(' -> ')}
              </div>
            )}
            {mroHighlight === null && (
              <div style={{ color: s.text3, fontSize: 11, marginLeft: 8 }}>Hover classes to see search order</div>
            )}
          </div>
        )}

        {!showMro && (
          <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>
            MRO determines which class's method is called when there are multiple base classes. Python uses C3 linearization.
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}

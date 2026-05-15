import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface SourceType {
  name: string
  age: number
  email: string
  isActive: boolean
}

const sourceKeys: (keyof SourceType)[] = ['name', 'age', 'email', 'isActive']
const sourceTypes: Record<keyof SourceType, string> = {
  name: 'string',
  age: 'number',
  email: 'string',
  isActive: 'boolean',
}

interface Transform {
  id: string
  label: string
  description: string
  definition: string
  transform: (input: SourceType) => Record<string, string>
  color: string
}

const transforms: Transform[] = [
  {
    id: 'partial',
    label: 'Partial<T>',
    description: 'All properties become optional (?)',
    color: s.yellow,
    definition: `type Partial<T> = {
  [K in keyof T]?: T[K]
}`,
    transform: (input: SourceType) => {
      const result: Record<string, string> = {}
      for (const key of sourceKeys) {
        result[key] = `${sourceTypes[key]} | undefined`
      }
      return result
    },
  },
  {
    id: 'required',
    label: 'Required<T>',
    description: 'All properties become required (remove ?)',
    color: s.green,
    definition: `type Required<T> = {
  [K in keyof T]-?: T[K]
}`,
    transform: (input: SourceType) => {
      const result: Record<string, string> = {}
      for (const key of sourceKeys) {
        result[key] = sourceTypes[key]
      }
      return result
    },
  },
  {
    id: 'readonly',
    label: 'Readonly<T>',
    description: 'All properties become readonly',
    color: s.accent,
    definition: `type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}`,
    transform: (input: SourceType) => {
      const result: Record<string, string> = {}
      for (const key of sourceKeys) {
        result[key] = `readonly ${sourceTypes[key]}`
      }
      return result
    },
  },
  {
    id: 'pick',
    label: 'Pick<T, K>',
    description: 'Select only specified keys',
    color: s.purple,
    definition: `type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}`,
    transform: (input: SourceType) => {
      const result: Record<string, string> = {}
      for (const key of sourceKeys) {
        if (key === 'name' || key === 'email') {
          result[key] = sourceTypes[key]
        }
      }
      return result
    },
  },
  {
    id: 'getters',
    label: 'Key Remapping',
    description: 'Transform keys with as clause',
    color: s.orange,
    definition: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
}`,
    transform: (input: SourceType) => {
      const result: Record<string, string> = {}
      for (const key of sourceKeys) {
        const getterName = `get${key.charAt(0).toUpperCase() + key.slice(1)}`
        result[getterName] = `() => ${sourceTypes[key]}`
      }
      return result
    },
  },
]

export default function TsMappedDemo() {
  const [activeTransform, setActiveTransform] = useState('partial')
  const [highlightedKey, setHighlightedKey] = useState<number | null>(null)

  const current = transforms.find(t => t.id === activeTransform) || transforms[0]

  const highlighted = useMemo(() => {
    const map: Record<string, string> = {}
    for (const t of transforms) {
      map[t.id] = Prism.highlight(t.definition, Prism.languages.typescript, 'typescript')
    }
    return map
  }, [])

  const transformedResult = current.transform({
    name: 'Alice',
    age: 30,
    email: 'alice@example.com',
    isActive: true,
  })

  return (
    <DemoBoundary name="TypeScript Mapped Types">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsm-code .token.keyword { color: #f92672; }
          .tsm-code .token.string, .tsm-code .token.char, .tsm-code .token.builtin, .tsm-code .token.inserted { color: #e6db74; }
          .tsm-code .token.number, .tsm-code .token.constant, .tsm-code .token.symbol, .tsm-code .token.property, .tsm-code .token.tag, .tsm-code .token.boolean, .tsm-code .token.deleted { color: #ae81ff; }
          .tsm-code .token.selector, .tsm-code .token.attr-name { color: #f92672; }
          .tsm-code .token.attr-value, .tsm-code .token.atrule { color: #e6db74; }
          .tsm-code .token.function, .tsm-code .token.class-name { color: #a6e22e; }
          .tsm-code .token.operator, .tsm-code .token.entity, .tsm-code .token.url, .tsm-code .token.punctuation { color: #f8f8f2; }
          .tsm-code .token.comment, .tsm-code .token.prolog, .tsm-code .token.doctype, .tsm-code .token.cdata { color: #75715e; font-style: italic; }
          .tsm-code .token.parameter, .tsm-code .token.variable, .tsm-code .token.regex, .tsm-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {transforms.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTransform(t.id)}
              style={{
                padding: '7px 14px',
                background: activeTransform === t.id ? t.color : s.bg2,
                border: `1px solid ${activeTransform === t.id ? t.color : s.border}`,
                borderRadius: 6,
                color: activeTransform === t.id ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: activeTransform === t.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 10, color: s.text3,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Definition
              </div>
              <div style={{ padding: 14, fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto' }}>
                <code className="tsm-code" dangerouslySetInnerHTML={{ __html: highlighted[current.id] }} />
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Source Type
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>interface User</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>
                  {'{'}
                </div>
                {sourceKeys.map((key, idx) => (
                  <div
                    key={key}
                    onMouseEnter={() => setHighlightedKey(idx)}
                    onMouseLeave={() => setHighlightedKey(null)}
                    style={{
                      padding: '4px 12px 4px 20px',
                      fontFamily: s.mono, fontSize: 12,
                      color: s.text,
                      background: highlightedKey === idx ? `${s.accent}10` : 'transparent',
                      transition: 'background 0.15s',
                      borderLeft: highlightedKey === idx ? `2px solid ${s.accent}` : '2px solid transparent',
                    }}
                  >
                    {key}: <span style={{ color: s.text3 }}>{sourceTypes[key]}</span>
                  </div>
                ))}
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 8 }}>
                  {'}'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${current.color}40`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: `1px solid ${current.color}20`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: current.color, flexShrink: 0,
            }} />
            <span style={{ fontFamily: s.mono, fontSize: 10, color: current.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Transformed Result
            </span>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
              {current.description}
            </span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>
              {'{'}
            </div>
            {Object.entries(transformedResult).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: '4px 12px 4px 20px',
                  fontFamily: s.mono, fontSize: 12,
                  color: s.text,
                  transition: 'background 0.15s',
                }}
              >
                {current.id === 'getters' ? (
                  <>
                    <span style={{ color: current.color }}>{key}</span>:{' '}
                    <span style={{ color: s.text3 }}>{value}</span>
                  </>
                ) : current.id === 'pick' ? (
                  <>
                    <span style={{ color: current.color }}>{key}</span>:{' '}
                    <span style={{ color: s.text3 }}>{value}</span>
                  </>
                ) : (
                  <>
                    {key}: <span style={{ color: s.text3 }}>{value}</span>
                  </>
                )}
              </div>
            ))}
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 8 }}>
              {'}'}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

import { useState, type ReactNode } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Rule {
  name: string
  validator: string
  badCode: string
  errorLine: number
  errorMsg: string
  fixCode: string
}

const rules: Rule[] = [
  {
    name: 'Conditional Hook Call',
    validator: 'validateHooksUsage',
    badCode: [
      'function Comp({ show }) {',
      '  const [count, setCount] = useState(0);',
      '',
      '  if (show) {',
      '    const [name, setName] = useState("");',
      '  }',
      '',
      '  return <div>{count}</div>;',
      '}',
    ].join('\n'),
    errorLine: 4,
    errorMsg: "Hooks must always be called in a consistent order, and may not be called conditionally.",
    fixCode: [
      'function Comp({ show }) {',
      '  const [count, setCount] = useState(0);',
      '  const [name, setName] = useState("");',
      '',
      '  return <div>{count}</div>;',
      '}',
    ].join('\n'),
  },
  {
    name: 'setState During Render',
    validator: 'validateNoSetStateInRender',
    badCode: [
      'function Comp() {',
      '  const [x, setX] = useState(0);',
      '',
      '  setX(1);',
      '',
      '  return <div>{x}</div>;',
      '}',
    ].join('\n'),
    errorLine: 4,
    errorMsg: "Cannot call setState during rendering.",
    fixCode: [
      'function Comp() {',
      '  const [x, setX] = useState(0);',
      '',
      '  useEffect(() => {',
      '    setX(1);',
      '  }, []);',
      '',
      '  return <div>{x}</div>;',
      '}',
    ].join('\n'),
  },
  {
    name: 'Impure Value in Render',
    validator: 'validateNoImpureValuesInRender',
    badCode: [
      'function Comp() {',
      '  const timestamp = Date.now();',
      '',
      '  return <div>{timestamp}</div>;',
      '}',
    ].join('\n'),
    errorLine: 2,
    errorMsg: "Date.now() is impure and its result cannot be memoized.",
    fixCode: [
      'function Comp() {',
      '  const [timestamp, setTimestamp] = useState(Date.now);',
      '',
      '  return <div>{timestamp}</div>;',
      '}',
    ].join('\n'),
  },
  {
    name: 'Ref Access in Render',
    validator: 'validateNoRefAccessInRender',
    badCode: [
      'function Comp() {',
      '  const ref = useRef(null);',
      '',
      '  return <div>{ref.current}</div>;',
      '}',
    ].join('\n'),
    errorLine: 4,
    errorMsg: "Cannot read ref.current during rendering because it may be mutated.",
    fixCode: [
      'function Comp() {',
      '  const ref = useRef(null);',
      '  const [value, setValue] = useState("");',
      '',
      '  useEffect(() => {',
      '    setValue(ref.current ?? "");',
      '  }, []);',
      '',
      '  return <div>{value}</div>;',
      '}',
    ].join('\n'),
  },
  {
    name: 'Mutable Local After Render',
    validator: 'validateLocalsNotReassignedAfterRender',
    badCode: [
      'function Comp() {',
      '  let x = 1;',
      '',
      '  useEffect(() => {',
      '    x = 2;',
      '  }, []);',
      '',
      '  return <div>{x}</div>;',
      '}',
    ].join('\n'),
    errorLine: 4,
    errorMsg: "Variable 'x' may be reassigned after render.",
    fixCode: [
      'function Comp() {',
      '  const [x, setX] = useState(1);',
      '',
      '  useEffect(() => {',
      '    setX(2);',
      '  }, []);',
      '',
      '  return <div>{x}</div>;',
      '}',
    ].join('\n'),
  },
  {
    name: 'JSX in Try Statement',
    validator: 'validateNoJSXInTryStatement',
    badCode: [
      'function Comp() {',
      '  try {',
      '    return <div>hello</div>;',
      '  } catch (e) {',
      '    return <div>error</div>;',
      '  }',
      '}',
    ].join('\n'),
    errorLine: 3,
    errorMsg: "JSX cannot be returned from within a try statement.",
    fixCode: [
      'function Comp() {',
      '  let content = <div>hello</div>;',
      '',
      '  try {',
      '  } catch (e) {',
      '    content = <div>error</div>;',
      '  }',
      '',
      '  return content;',
      '}',
    ].join('\n'),
  },
]

function kw(t: string) {
  return <span style={{ color: '#f92672' }}>{t}</span>
}

function fn(t: string) {
  return <span style={{ color: '#a6e22e' }}>{t}</span>
}

function str(t: string) {
  return <span style={{ color: '#e6db74' }}>{t}</span>
}

function num(t: string) {
  return <span style={{ color: '#ae81ff' }}>{t}</span>
}

function cm(t: string) {
  return <span style={{ color: '#75715e', fontStyle: 'italic' }}>{t}</span>
}

function pun(t: string) {
  return <span style={{ color: '#f8f8f2' }}>{t}</span>
}

function CodeLine({
  text,
  isError,
  lineNum,
}: {
  text: string
  isError: boolean
  lineNum: number
}) {
  const tokens = tokenize(text)
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: s.mono,
        fontSize: 13,
        lineHeight: '22px',
        background: isError ? 'rgba(232, 93, 93, 0.1)' : undefined,
        borderLeft: isError ? `2px solid ${s.red}` : '2px solid transparent',
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <span style={{ width: 28, display: 'inline-block', color: s.text3, userSelect: 'none', textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
        {lineNum}
      </span>
      <span style={{ whiteSpace: 'pre', color: isError ? s.red : s.text2 }}>{tokens}</span>
    </div>
  )
}

function tokenize(line: string) {
  const result: ReactNode[] = []
  let i = 0
  const src = line

  while (i < src.length) {
    if (src[i] === '/' && src[i + 1] === '/') {
      result.push(cm(src.slice(i)))
      break
    }
    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const q = src[i]
      let j = i + 1
      while (j < src.length && src[j] !== q) {
        if (src[j] === '\\') j++
        j++
      }
      result.push(str(src.slice(i, j + 1)))
      i = j + 1
      continue
    }
    if (/[0-9]/.test(src[i])) {
      let j = i
      while (j < src.length && /[0-9]/.test(src[j])) j++
      result.push(num(src.slice(i, j)))
      i = j
      continue
    }
    if (/[a-zA-Z_$]/.test(src[i])) {
      let j = i
      while (j < src.length && /[a-zA-Z0-9_$]/.test(src[j])) j++
      const word = src.slice(i, j)
      if (['function', 'const', 'let', 'return', 'if', 'try', 'catch', 'new', 'import', 'from', 'export', 'default', 'else', 'throw', 'null', 'undefined', 'true', 'false'].includes(word)) {
        result.push(kw(word))
      } else if (word[0] === word[0].toUpperCase() || ['useState', 'useRef', 'useEffect', 'useMemo', 'useCallback'].includes(word)) {
        result.push(fn(word))
      } else {
        result.push(<span key={i}>{word}</span>)
      }
      i = j
      continue
    }
    if (/[<>{}()[\];,.:=!&|+\-*/?]/.test(src[i])) {
      result.push(pun(src[i]))
      i++
      continue
    }
    result.push(src[i])
    i++
  }

  return result
}

function RuleCard({ rule, index, isOpen, onToggle }: { rule: Rule; index: number; isOpen: boolean; onToggle: () => void }) {
  const badLines = rule.badCode.split('\n')
  const fixLines = rule.fixCode.split('\n')

  return (
    <div
      style={{
        border: `1px solid ${isOpen ? s.border2 : s.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: index < rules.length - 1 ? 8 : 0,
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: isOpen ? s.bg2 : s.bg,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: isOpen ? `${s.accent}20` : `${s.bg3}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <span style={{
            color: isOpen ? s.accent : s.text3,
            fontSize: 12,
            transition: 'transform 0.2s, color 0.2s',
            display: 'inline-block',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            {'\u25B6'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 2 }}>
            {rule.name}
          </div>
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
            {rule.validator}
          </div>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: s.mono,
          color: s.red,
          background: 'rgba(232, 93, 93, 0.12)',
          padding: '3px 8px',
          borderRadius: 4,
          letterSpacing: 0.5,
        }}>
          ERROR
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? 800 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div style={{ padding: '0 18px 18px', background: s.bg2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Invalid Code
          </div>
          <div style={{
            background: s.bg,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            {badLines.map((line, i) => (
              <CodeLine
                key={i}
                text={line}
                isError={i + 1 === rule.errorLine}
                lineNum={i + 1}
              />
            ))}
          </div>

          <div style={{
            background: 'rgba(232, 93, 93, 0.08)',
            border: `1px solid rgba(232, 93, 93, 0.25)`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span style={{ color: s.red, fontSize: 13, marginTop: -1, flexShrink: 0 }}>{'\u2717'}</span>
            <span style={{ fontSize: 13, color: s.red, fontFamily: s.mono, lineHeight: 1.5 }}>
              {rule.errorMsg}
            </span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fix
          </div>
          <div style={{
            background: s.bg,
            borderRadius: 8,
            border: `1px solid rgba(61, 214, 140, 0.25)`,
            overflow: 'hidden',
          }}>
            {fixLines.map((line, i) => (
              <CodeLine
                key={i}
                text={line}
                isError={false}
                lineNum={i + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ValidationRulesDemo() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <DemoBoundary name="Validation Rules">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg,
        borderRadius: 12,
        border: `1px solid ${s.border}`,
        padding: '28px 32px 24px',
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4 }}>
            Compiler Validation Rules
          </div>
          <div style={{ fontSize: 13, color: s.text3 }}>
            6 rules the React Compiler enforces to guarantee safe memoization
          </div>
        </div>

        {rules.map((rule, i) => (
          <RuleCard
            key={i}
            rule={rule}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </DemoBoundary>
  )
}

import { useState, useMemo } from 'react'
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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type AnalyzerConfig = {
  label: string
  stopWords: Set<string>
  stem: boolean
  lowercase: boolean
}

const analyzers: Record<string, AnalyzerConfig> = {
  standard: { label: 'Standard', stopWords: new Set(), stem: false, lowercase: true },
  simple: { label: 'Simple (letter)', stopWords: new Set(), stem: false, lowercase: true },
  english: { label: 'English', stopWords: new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'with', 'from', 'and', 'or', 'not', 'but', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'their', 'our']), stem: true, lowercase: true },
}

const stemMap: Record<string, string> = {
  running: 'run', runs: 'run', runner: 'run', foxes: 'fox', jumped: 'jump', jumps: 'jump', jumping: 'jump',
  sleeping: 'sleep', sleeps: 'sleep', fastest: 'fast', faster: 'fast', quickly: 'quick',
  eating: 'eat', eats: 'eat', ate: 'eat', chickens: 'chicken', dogs: 'dog', lazy: 'lazi',
}

function stem(w: string): string {
  return stemMap[w] || w
}

function standardTokenize(text: string): string[] {
  return text.split(/[^a-zA-Z0-9']+/).filter(Boolean)
}

function letterTokenize(text: string): string[] {
  return text.split(/[^a-zA-Z]+/).filter(Boolean)
}

export default function EsAnalysisDemo() {
  const [text, setText] = useState('The foxes are running fast')
  const [analyzerKey, setAnalyzerKey] = useState('standard')

  const result = useMemo(() => {
    const cfg = analyzers[analyzerKey]
    let tokens: string[]

    if (analyzerKey === 'simple') {
      tokens = letterTokenize(text)
    } else {
      tokens = standardTokenize(text)
    }

    const afterCharFilter = text
    const afterTokenizer = [...tokens]
    let afterLowercase = [...afterTokenizer]

    if (cfg.lowercase) {
      afterLowercase = afterTokenizer.map(t => t.toLowerCase())
    }

    let afterStop: string[]
    if (analyzerKey === 'english') {
      afterStop = afterLowercase.filter(t => !cfg.stopWords.has(t.toLowerCase()))
    } else {
      afterStop = [...afterLowercase]
    }

    let afterStem: string[]
    if (cfg.stem) {
      afterStem = afterStop.map(t => stem(t))
    } else {
      afterStem = [...afterStop]
    }

    return { afterCharFilter, afterTokenizer, afterLowercase, afterStop, afterStem }
  }, [text, analyzerKey])

  return (
    <DemoBoundary name="Elasticsearch Analysis Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Analysis Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          See how text flows through the analysis chain. Each step transforms the tokens before they reach the inverted index.
        </p>

        <div style={{ marginBottom: 16 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type text to analyze..."
            style={{
              width: '100%', padding: '10px 14px', background: s.bg, border: `1px solid ${s.border2}`,
              borderRadius: 8, color: s.text, fontFamily: s.mono, fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(analyzers).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setAnalyzerKey(key)}
              style={{
                background: analyzerKey === key ? s.accent : s.bg3,
                border: `1px solid ${analyzerKey === key ? s.accent : s.border}`,
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                color: analyzerKey === key ? '#fff' : s.text2, fontSize: 12, fontWeight: analyzerKey === key ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <StepBox label="Input" tokens={[text]} color={s.text3} mono={false} />
          <Arrow />
          <StepBox label="Character Filters" tokens={[result.afterCharFilter]} color={s.text3} mono={false} />
          <Arrow />
          <StepBox label={`Tokenizer (${analyzerKey === 'simple' ? 'letter' : 'standard'})`} tokens={result.afterTokenizer} color={s.accent} />
          {analyzers[analyzerKey].lowercase && (
            <>
              <Arrow />
              <StepBox label="Lowercase Filter" tokens={result.afterLowercase} color={s.green} />
            </>
          )}
          {result.afterStop.length < result.afterLowercase.length && (
            <>
              <Arrow />
              <StepBox label={`Stop Filter (removed ${result.afterLowercase.length - result.afterStop.length} words)`} tokens={result.afterStop} color={s.yellow} />
            </>
          )}
          {analyzers[analyzerKey].stem && (
            <>
              <Arrow />
              <StepBox label="Stemmer Filter" tokens={result.afterStem} color={s.purple} />
            </>
          )}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Final Tokens
          </span>
          {result.afterStem.map((t, i) => (
            <span key={i} style={{
              background: s.bg3, border: `1px solid ${s.border2}`, borderRadius: 4,
              padding: '4px 10px', color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600,
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function Arrow() {
  return (
    <div style={{ textAlign: 'center', color: s.text3, fontSize: 16, lineHeight: '12px' }}>
      &#9660;
    </div>
  )
}

function StepBox({ label, tokens, color, mono }: { label: string; tokens: string[]; color: string; mono?: boolean }) {
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tokens.map((t, i) => (
          <span key={i} style={{
            background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 4,
            padding: '2px 8px', color, fontFamily: mono !== false ? s.mono : undefined, fontSize: 13,
          }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

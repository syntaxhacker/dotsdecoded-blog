import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'

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

const sourceFiles = [
  { name: 'application.scss', type: 'scss', color: s.purple },
  { name: 'buttons.scss', type: 'scss', color: s.purple },
  { name: 'layout.scss', type: 'scss', color: s.purple },
  { name: 'application.js', type: 'js', color: s.yellow },
  { name: 'charts.js', type: 'js', color: s.yellow },
  { name: 'animations.js', type: 'js', color: s.yellow },
]

const pipelineSteps = [
  { label: 'Detect', desc: 'Sprockets reads manifest directives' },
  { label: 'Concatenate', desc: 'Merge files into single bundles' },
  { label: 'Transform', desc: 'SCSS to CSS, ES6+ to ES5' },
  { label: 'Minify', desc: 'Remove whitespace and shorten names' },
  { label: 'Fingerprint', desc: 'Append content hash to filename' },
]

const scssSource = `$primary: #3498db;
$radius: 4px;

.btn {
  background: $primary;
  border-radius: $radius;
  padding: 8px 16px;
  color: white;
}`

const scssSourceHtml = Prism.highlight(scssSource, Prism.languages.css, 'css')

const cssOutput = `.btn{background:#3498db;border-radius:4px;padding:8px 16px;color:#fff}`

const jsSource = `function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

greet("World");`

const jsSourceHtml = Prism.highlight(jsSource, Prism.languages.javascript, 'javascript')

const jsOutput = `function greet(e){var t="Hello, "+e+"!";return console.log(t),t}greet("World");`

export default function AssetPipelineDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'scss' | 'js'>('scss')

  const is = (idx: number) => activeStep === idx
  const fileProcessed = activeStep >= 1
  const fileTransformed = activeStep >= 2
  const fileMinified = activeStep >= 3
  const fileFingerprinted = activeStep >= 4

  const fingerprints = useMemo(() => ({
    css: 'a1b2c3d4e5',
    js: 'f6g7h8i9j0',
  }), [])

  const pipelineCssHtml = useMemo(() => {
    if (fileMinified || fileTransformed) {
      return Prism.highlight(cssOutput, Prism.languages.css, 'css')
    }
    return scssSourceHtml
  }, [fileMinified, fileTransformed])

  const pipelineJsHtml = useMemo(() => {
    if (fileMinified || fileTransformed) {
      return Prism.highlight(jsOutput, Prism.languages.javascript, 'javascript')
    }
    return jsSourceHtml
  }, [fileMinified, fileTransformed])

  const fileViewHtml = useMemo(() => {
    if (viewMode === 'scss') return scssSourceHtml
    return jsSourceHtml
  }, [viewMode])

  return (
    <DemoBoundary name="Asset Pipeline">
    <div className="apc" style={{ background: s.bg, padding: '28px 20px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <style>{`
.apc code .token.keyword { color: #f92672; }
.apc code .token.string, .apc code .token.char, .apc code .token.builtin, .apc code .token.inserted { color: #e6db74; }
.apc code .token.number, .apc code .token.constant, .apc code .token.symbol, .apc code .token.property, .apc code .token.tag, .apc code .token.boolean, .apc code .token.deleted { color: #ae81ff; }
.apc code .token.selector, .apc code .token.attr-name { color: #f92672; }
.apc code .token.attr-value, .apc code .token.atrule { color: #e6db74; }
.apc code .token.function, .apc code .token.class-name { color: #a6e22e; }
.apc code .token.operator, .apc code .token.entity, .apc code .token.url, .apc code .token.punctuation { color: #f8f8f2; }
.apc code .token.comment, .apc code .token.prolog, .apc code .token.doctype, .apc code .token.cdata { color: #75715e; font-style: italic; }
.apc code .token.parameter, .apc code .token.variable, .apc code .token.regex, .apc code .token.important { color: #fd971f; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>The Asset Pipeline</div>
        <button
          onClick={() => { setActiveStep(-1); setSelectedFile(null) }}
          style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '5px 12px', color: s.text2, fontSize: 12, fontFamily: s.mono, cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 20 }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Source Files</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sourceFiles.map((f) => (
              <div
                key={f.name}
                onClick={() => setSelectedFile(selectedFile === f.name ? null : f.name)}
                style={{
                  background: selectedFile === f.name ? s.bg3 : 'transparent',
                  border: `1px solid ${selectedFile === f.name ? f.color : 'transparent'}`,
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                  fontFamily: s.mono, fontSize: 12, color: selectedFile === f.name ? f.color : s.text2,
                  transition: 'all 0.2s ease',
                }}
              >
                {f.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', minWidth: 120 }}>
          {pipelineSteps.map((step, idx) => (
            <button
              key={step.label}
              onClick={() => setActiveStep(activeStep === idx ? idx - 1 : idx)}
              style={{
                background: is(idx) ? s.accent : s.bg2,
                border: `1px solid ${is(idx) ? s.accent : s.border}`,
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                color: is(idx) ? '#fff' : s.text2,
                fontSize: 12, fontWeight: is(idx) ? 700 : 400,
                transition: 'all 0.25s ease', width: '100%', textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: s.mono, fontWeight: 600, fontSize: 11 }}>{step.label}</div>
              {is(idx) && (
                <div style={{ fontSize: 10, color: is(idx) ? 'rgba(255,255,255,0.8)' : s.text3, marginTop: 2, lineHeight: 1.4 }}>
                  {step.desc}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, background: s.bg2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {fileFingerprinted ? 'Fingerprinted Output' : fileMinified ? 'Minified Output' : fileTransformed ? 'Compiled Output' : fileProcessed ? 'Concatenated Bundle' : 'Raw Output'}
          </div>
          {activeStep < 0 && (
            <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.6 }}>
              Click a pipeline step to see how assets are processed. Start with "Detect" to begin.
            </div>
          )}
          {activeStep >= 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                background: s.bg, borderRadius: 8, padding: '10px 12px',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.purple, marginBottom: 6 }}>
                  {fileFingerprinted ? `application-${fingerprints.css}.css` : fileMinified ? 'application.css' : fileTransformed ? 'application.css' : fileProcessed ? 'application.css' : 'application.scss'}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, wordBreak: 'break-all', whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: pipelineCssHtml }} />
                </div>
              </div>
              <div style={{
                background: s.bg, borderRadius: 8, padding: '10px 12px',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.yellow, marginBottom: 6 }}>
                  {fileFingerprinted ? `application-${fingerprints.js}.js` : fileMinified ? 'application.js' : fileTransformed ? 'application.js' : fileProcessed ? 'application.js' : 'application.js'}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, wordBreak: 'break-all', whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: pipelineJsHtml }} />
                </div>
              </div>
              {fileFingerprinted && (
                <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: s.accent, fontFamily: s.mono, lineHeight: 1.5 }}>
                  Hash derived from content -- any change produces a new filename, busting browser cache automatically.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div style={{ background: s.bg2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['scss', 'js'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? s.accent : s.bg3,
                  border: `1px solid ${viewMode === mode ? s.accent : s.border}`,
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  color: viewMode === mode ? '#fff' : s.text2,
                  fontFamily: s.mono, fontSize: 11, fontWeight: 600,
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre' }}>
              <code dangerouslySetInnerHTML={{ __html: fileViewHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}

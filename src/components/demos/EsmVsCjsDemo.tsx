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

const KW = '#f92672'
const STR = '#e6db74'
const FN = '#a6e22e'
const CM = '#75715e'
const PN = '#f8f8f2'

function K({ c, children }: { c: string; children: React.ReactNode }) {
  return <span style={{ color: c }}>{children}</span>
}

function Lbl({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 600, fontFamily: s.mono,
      letterSpacing: 0.5, color, background: bg, marginRight: 8,
    }}>{text}</span>
  )
}

function EsmVsCjsDemo() {
  const [showBundle, setShowBundle] = useState(false)

  const esmSize = 0.8
  const cjsSize = 4.2
  const savings = Math.round((1 - esmSize / cjsSize) * 100)
  const maxBar = 600
  const esmBar = Math.round((esmSize / cjsSize) * maxBar)
  const cjsBar = maxBar

  const funcs = useMemo(() => [
    { name: 'formatDate', params: '(date)', body: 'return `${m}/${d}/${y}`' },
    { name: 'parseDate', params: '(str)', body: 'return new Date(str)' },
    { name: 'addDays', params: '(date, n)', body: 'const r = new Date(date)\nr.setDate(r.getDate() + n)\nreturn r' },
    { name: 'diffDays', params: '(a, b)', body: 'return Math.round((b - a) / 86400000)' },
    { name: 'isValid', params: '(date)', body: 'return date instanceof Date && !isNaN(date)' },
  ], [])

  const codeBox: React.CSSProperties = {
    marginTop: 8, padding: '10px 14px', background: s.bg2,
    borderRadius: 6, border: `1px solid ${s.border}`, overflowX: 'auto',
  }

  function renderEsmImport() {
    return (
      <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, color: PN }}>
        <K c={KW}>import</K>{' { '}<K c={FN}>formatDate</K>{' } '}<K c={KW}>from</K>{' '}<K c={STR}>{'\'./utils\''}</K>
      </div>
    )
  }

  function renderCjsImport() {
    return (
      <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, color: PN }}>
        <K c={KW}>const</K>{' { '}<K c={FN}>formatDate</K>{' } = '}<K c={FN}>require</K>(<K c={STR}>{'\'./utils\''}</K>)
      </div>
    )
  }

  function renderEsmModule() {
    return (
      <div style={{ lineHeight: 1.7 }}>
        <div><K c={CM}>{'// utils.js'}</K></div>
        {funcs.map((fn) => (
          <div key={fn.name}>
            <div><K c={KW}>{'export function'}</K>{' '}<K c={FN}>{fn.name}</K><K c={PN}>{fn.params + ' {'}</K></div>
            {fn.body.split('\n').map((line, li) => (
              <div key={li} style={{ paddingLeft: 16 }}>
                {line.startsWith('return new') ? (
                  <><K c={KW}>return new </K><K c={FN}>Date</K><K c={PN}>{line.replace('return new Date', '')}</K></>
                ) : line.startsWith('return') ? (
                  <><K c={KW}>return </K><K c={PN}>{line.slice(7)}</K></>
                ) : (
                  <K c={PN}>{line}</K>
                )}
              </div>
            ))}
            <div><K c={PN}>{'}'}</K></div>
          </div>
        ))}
      </div>
    )
  }

  function renderCjsModule() {
    return (
      <div style={{ lineHeight: 1.7 }}>
        <div><K c={CM}>{'// utils.js'}</K></div>
        {funcs.map((fn) => (
          <div key={fn.name}>
            <div><K c={KW}>{'function'}</K>{' '}<K c={FN}>{fn.name}</K><K c={PN}>{fn.params + ' {'}</K></div>
            {fn.body.split('\n').map((line, li) => (
              <div key={li} style={{ paddingLeft: 16 }}>
                {line.startsWith('return new') ? (
                  <><K c={KW}>return new </K><K c={FN}>Date</K><K c={PN}>{line.replace('return new Date', '')}</K></>
                ) : line.startsWith('return') ? (
                  <><K c={KW}>return </K><K c={PN}>{line.slice(7)}</K></>
                ) : (
                  <K c={PN}>{line}</K>
                )}
              </div>
            ))}
            <div><K c={PN}>{'}'}</K></div>
          </div>
        ))}
        <div style={{ height: 4 }} />
        <div><K c={PN}>{'module.'}</K><K c={FN}>{'exports'}</K><K c={PN}>{' = {'}</K></div>
        <div style={{ paddingLeft: 16 }}><K c={PN}>{'formatDate, parseDate, addDays, diffDays, isValid'}</K></div>
        <div><K c={PN}>{'}'}</K></div>
      </div>
    )
  }

  function renderEsmBundle() {
    const fn = funcs[0]
    return (
      <div style={{ lineHeight: 1.7 }}>
        <div><K c={CM}>{'// bundle.js (after tree shaking)'}</K></div>
        <div><K c={KW}>{'function'}</K>{' '}<K c={FN}>{fn.name}</K><K c={PN}>{fn.params + ' {'}</K></div>
        {fn.body.split('\n').map((line, li) => (
          <div key={li} style={{ paddingLeft: 16 }}>
            {line.startsWith('return') ? (
              <><K c={KW}>return </K><K c={PN}>{line.slice(7)}</K></>
            ) : (
              <K c={PN}>{line}</K>
            )}
          </div>
        ))}
        <div><K c={PN}>{'}'}</K></div>
        <div style={{ marginTop: 4, opacity: 0.35, textDecoration: 'line-through', textDecorationColor: s.red }}>
          <div><K c={CM}>{'// parseDate, addDays, diffDays, isValid'}</K></div>
          <div><K c={CM}>{'// -- removed by tree shaking --'}</K></div>
        </div>
      </div>
    )
  }

  function renderCjsBundle() {
    return (
      <div style={{ lineHeight: 1.7 }}>
        <div><K c={CM}>{'// bundle.js (no tree shaking possible)'}</K></div>
        {funcs.map((fn) => (
          <div key={fn.name}>
            <div><K c={KW}>{'function'}</K>{' '}<K c={FN}>{fn.name}</K><K c={PN}>{fn.params + ' {'}</K></div>
            {fn.body.split('\n').map((line, li) => (
              <div key={li} style={{ paddingLeft: 16 }}>
                {line.startsWith('return new') ? (
                  <><K c={KW}>return new </K><K c={FN}>Date</K><K c={PN}>{line.replace('return new Date', '')}</K></>
                ) : line.startsWith('return') ? (
                  <><K c={KW}>return </K><K c={PN}>{line.slice(7)}</K></>
                ) : (
                  <K c={PN}>{line}</K>
                )}
              </div>
            ))}
            <div><K c={PN}>{'}'}</K></div>
          </div>
        ))}
      </div>
    )
  }

  function Column({
    header, headerColor, importEl, moduleEl,
    bundleEl, bundleLabel, bundleLabelColor, bundleBorderColor,
  }: {
    header: string; headerColor: string; importEl: React.ReactNode; moduleEl: React.ReactNode;
    bundleEl: React.ReactNode; bundleLabel: string; bundleLabelColor: string; bundleBorderColor: string;
  }) {
    return (
      <div>
        <div style={{
          padding: '10px 16px', background: `${headerColor}10`,
          borderBottom: `1px solid ${s.border}`, fontSize: 13, fontWeight: 700,
          color: headerColor, fontFamily: s.mono,
        }}>{header}</div>

        <div style={{ padding: '12px 16px' }}>
          <Lbl text="YOUR CODE" color={s.text3} bg={s.bg3} />
          <div style={codeBox}>{importEl}</div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <Lbl text="MODULE SOURCE" color={s.text3} bg={s.bg3} />
          <div style={codeBox}>
            <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, color: PN }}>
              {moduleEl}
            </div>
          </div>
        </div>

        {showBundle && (
          <div style={{ padding: '0 16px 16px' }}>
            <Lbl text="BUNDLE OUTPUT" color={bundleLabelColor} bg={`${bundleLabelColor}15`} />
            <div style={{ ...codeBox, border: `1px solid ${bundleBorderColor}` }}>
              <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, color: PN }}>
                {bundleEl}
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: bundleLabelColor, fontFamily: s.mono }}>
              {bundleLabel}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <DemoBoundary name="ES Modules vs CommonJS">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${s.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>
            ESM vs CJS: Why Tree Shaking Only Works with ES Modules
          </div>
          <button onClick={() => setShowBundle(v => !v)} style={{
            padding: '6px 14px', borderRadius: 6, border: `1px solid ${s.border2}`,
            background: showBundle ? s.accent : s.bg3, color: showBundle ? s.bg : s.text2,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: s.mono, transition: 'all 0.2s',
          }}>
            {showBundle ? 'Hide Bundle Output' : 'Show Bundle Output'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ borderRight: `1px solid ${s.border}` }}>
            <Column
              header="ES Modules" headerColor={s.green}
              importEl={renderEsmImport()} moduleEl={renderEsmModule()}
              bundleEl={renderEsmBundle()}
              bundleLabel="Only formatDate included -- 4 functions removed"
              bundleLabelColor={s.green} bundleBorderColor={`${s.green}30`}
            />
          </div>
          <Column
            header="CommonJS" headerColor={s.red}
            importEl={renderCjsImport()} moduleEl={renderCjsModule()}
            bundleEl={renderCjsBundle()}
            bundleLabel="All 5 functions included -- require() is dynamic"
            bundleLabelColor={s.red} bundleBorderColor={`${s.red}30`}
          />
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${s.border}`, background: s.bg2 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: s.text3, fontFamily: s.mono,
            letterSpacing: 0.5, marginBottom: 12,
          }}>{'BUNDLE SIZE COMPARISON'}</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: s.green, fontFamily: s.mono, fontWeight: 600 }}>{'ES Modules'}</span>
              <span style={{ fontSize: 12, color: s.green, fontFamily: s.mono }}>{`${esmSize} KB`}</span>
            </div>
            <div style={{ width: '100%', height: 24, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: esmBar, height: '100%',
                background: `linear-gradient(90deg, ${s.green}cc, ${s.green})`,
                borderRadius: 4, transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: s.red, fontFamily: s.mono, fontWeight: 600 }}>{'CommonJS'}</span>
              <span style={{ fontSize: 12, color: s.red, fontFamily: s.mono }}>{`${cjsSize} KB`}</span>
            </div>
            <div style={{ width: '100%', height: 24, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: cjsBar, height: '100%',
                background: `linear-gradient(90deg, ${s.red}cc, ${s.red})`,
                borderRadius: 4, transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: s.green, fontFamily: s.mono, fontWeight: 600 }}>
            {`${savings}% smaller with ES Modules`}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default EsmVsCjsDemo

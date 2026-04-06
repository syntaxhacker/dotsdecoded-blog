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

function CodeLine({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '2px 0',
        borderRadius: 3,
        background: highlight ? 'rgba(224, 176, 64, 0.1)' : undefined,
        borderLeft: highlight ? '3px solid' : '3px solid transparent',
        borderLeftColor: highlight ? s.orange : undefined,
        paddingLeft: highlight ? 9 : 12,
      }}
    >
      {children}
    </div>
  )
}

function Token({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ color, fontFamily: s.mono, fontSize: 13 }}>{children}</span>
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0d1017',
        borderRadius: 6,
        padding: '10px 0',
        fontFamily: s.mono,
        fontSize: 13,
        lineHeight: '20px',
      }}
    >
      {children}
    </div>
  )
}

function BundleResult({
  label,
  status,
  size,
}: {
  label: string
  status: 'safe' | 'danger' | 'warning'
  size: string
}) {
  const colors = {
    safe: { bg: 'rgba(61, 214, 140, 0.08)', border: s.green, text: s.green },
    danger: { bg: 'rgba(232, 93, 93, 0.08)', border: s.red, text: s.red },
    warning: { bg: 'rgba(224, 176, 64, 0.08)', border: s.yellow, text: s.yellow },
  }
  const c = colors[status]

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        padding: '8px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>
          {status === 'safe' ? '\u2713' : status === 'danger' ? '\u25CF' : '\u25B2'}
        </span>
        <span style={{ color: c.text, fontSize: 12, fontFamily: s.mono }}>{label}</span>
      </div>
      <span style={{ color: c.text, fontSize: 11, fontFamily: s.mono, opacity: 0.8 }}>{size}</span>
    </div>
  )
}

function Panel({
  title,
  badge,
  badgeColor,
  children,
}: {
  title: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: s.bg2,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{title}</span>
        {badge && (
          <span
            style={{
              color: badgeColor,
              fontSize: 10,
              fontFamily: s.mono,
              background: `${badgeColor}15`,
              padding: '2px 7px',
              borderRadius: 4,
              border: `1px solid ${badgeColor}30`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: checked ? s.green : s.bg3,
          position: 'relative',
          transition: 'background 0.2s',
          outline: 'none',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            background: s.text,
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            transition: 'left 0.2s',
          }}
        />
      </button>
      <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>{label}</span>
    </div>
  )
}

export default function SideEffectDemo() {
  const [declaredSafe, setDeclaredSafe] = useState(false)

  return (
    <DemoBoundary name="Side Effects Explorer">
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
          }}
        >
          <Panel title="Pure Module" badge="NO SIDE EFFECTS" badgeColor={s.green}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>// logger.js</div>
            <CodeBlock>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">log</Token>
                <Token color={s.text}>(</Token>
                <Token color={s.text}>msg</Token>
                <Token color={s.text}>) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  </Token>
                <Token color={s.text}>console.</Token>
                <Token color="#a6e22e">log</Token>
                <Token color={s.text}>(msg)</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">warn</Token>
                <Token color={s.text}>(msg) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  console.warn(msg)</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">error</Token>
                <Token color={s.text}>(msg) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  console.error(msg)</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
            </CodeBlock>
            <div
              style={{
                color: s.accent,
                fontSize: 11,
                fontFamily: s.mono,
                padding: '4px 0',
              }}
            >
              import {'{'} log {'}'} from {'\'./logger\''}
            </div>
            <BundleResult label="No side effects - tree shaking works!" status="safe" size="0.3 KB" />
          </Panel>

          <Panel title="Module with Side Effects" badge="SIDE EFFECTS" badgeColor={s.red}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>// analytics.js</div>
            <CodeBlock>
              <CodeLine highlight>
                <Token color={s.text}>window.__analytics = []</Token>
              </CodeLine>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">track</Token>
                <Token color={s.text}>(event) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  window.__analytics.</Token>
                <Token color="#a6e22e">push</Token>
                <Token color={s.text}>(event)</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">identify</Token>
                <Token color={s.text}>(userId) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  window.__analytics.</Token>
                <Token color="#a6e22e">push</Token>
                <Token color={s.text}>({'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>    </Token>
                <Token color="#e6db74">type</Token>
                <Token color={s.text}>: </Token>
                <Token color="#e6db74">'identify'</Token>
                <Token color={s.text}>,</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>    userId</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  {'}'})</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
            </CodeBlock>
            <div
              style={{
                color: s.accent,
                fontSize: 11,
                fontFamily: s.mono,
                padding: '4px 0',
              }}
            >
              import {'{'} track {'}'} from {'\'./analytics\''}
            </div>
            <BundleResult label="Side effect detected - entire module kept!" status="danger" size="0.8 KB" />
          </Panel>

          <Panel title="Declared Safe" badge={declaredSafe ? 'SAFE' : 'UNSAFE'} badgeColor={declaredSafe ? s.green : s.red}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>// analytics.js</div>
            <CodeBlock>
              <CodeLine highlight={declaredSafe}>
                <Token color={declaredSafe ? s.text3 : s.text}>window.__analytics = []</Token>
              </CodeLine>
              <CodeLine>
                <Token color="#f92672">export function </Token>
                <Token color="#a6e22e">track</Token>
                <Token color={s.text}>(event) {'{'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>  window.__analytics.</Token>
                <Token color="#a6e22e">push</Token>
                <Token color={s.text}>(event)</Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text}>{'}'}</Token>
              </CodeLine>
              <CodeLine>
                <Token color={declaredSafe ? s.text3 : s.text}>
                  <Token color="#f92672">export function </Token>
                  <Token color={declaredSafe ? s.text3 : '#a6e22e'}>identify</Token>
                  <Token color={s.text3}>(userId) {'{'}</Token>
                </Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text3}>
                  {'  window.__analytics.push({'}
                </Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text3}>
                  {"    type: 'identify', userId"}
                </Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text3}>
                  {'  })'}
                </Token>
              </CodeLine>
              <CodeLine>
                <Token color={s.text3}>{'}'}</Token>
              </CodeLine>
            </CodeBlock>
            <div
              style={{
                color: s.accent,
                fontSize: 11,
                fontFamily: s.mono,
                padding: '4px 0',
              }}
            >
              import {'{'} track {'}'} from {'\'./analytics\''}
            </div>
            <Toggle
              checked={declaredSafe}
              onChange={setDeclaredSafe}
              label="sideEffects: false in package.json"
            />
            {declaredSafe ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <BundleResult label="Trusting declaration - tree shaking enabled!" status="safe" size="0.3 KB" />
                <div
                  style={{
                    color: s.yellow,
                    fontSize: 10,
                    fontFamily: s.mono,
                    padding: '4px 8px',
                    background: 'rgba(224, 176, 64, 0.06)',
                    borderRadius: 4,
                    borderLeft: '2px solid ' + s.yellow,
                  }}
                >
                  Warning: window.__analytics = [] is removed at runtime. If this initialization was needed, your app will break.
                </div>
              </div>
            ) : (
              <BundleResult label="Side effect detected - entire module kept!" status="danger" size="0.8 KB" />
            )}
          </Panel>
        </div>

        <div
          style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '10px 14px',
          }}
        >
          <span style={{ color: s.text2, fontSize: 12, lineHeight: '18px' }}>
            Side effects force bundlers to be conservative. They keep everything because removing code that does something would break your app. Declaring a module safe with{' '}
            <span style={{ color: s.accent, fontFamily: s.mono }}>sideEffects: false</span>{' '}
            tells the bundler "trust me, this module is safe to tree shake" -- but if the declaration is wrong, things will silently break.
          </span>
        </div>
      </div>
    </DemoBoundary>
  )
}

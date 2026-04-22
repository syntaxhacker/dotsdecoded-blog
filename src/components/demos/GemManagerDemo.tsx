import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-bash'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Gem {
  name: string
  desc: string
  adds: string[]
  deps: string[]
  group: string
}

const gems: Gem[] = [
  {
    name: 'devise',
    desc: 'Full-featured authentication solution',
    adds: ['User model', 'Sessions controller', 'Login/Logout views', 'Password reset', 'Remember me cookies'],
    deps: ['warden', 'orm_adapter', 'bcrypt'],
    group: 'main',
  },
  {
    name: 'pg',
    desc: 'PostgreSQL adapter for ActiveRecord',
    adds: ['PostgreSQL connection', 'Advanced query types', 'Schema migrations support'],
    deps: [],
    group: 'main',
  },
  {
    name: 'puma',
    desc: 'Fast, threaded HTTP application server',
    adds: ['Multi-threaded server', 'Cluster mode', 'Hot reload in dev'],
    deps: ['nio4r'],
    group: 'main',
  },
  {
    name: 'rspec-rails',
    desc: 'RSpec testing framework for Rails',
    adds: ['RSpec generators', 'Spec helpers', 'Request specs', 'Model specs', 'Controller specs'],
    deps: ['rspec-core', 'rspec-expectations', 'rspec-mocks', 'rspec-support'],
    group: 'test',
  },
  {
    name: 'bootstrap',
    desc: 'CSS framework for responsive UIs',
    adds: ['Grid system', 'Responsive utilities', 'Component styles', 'JavaScript plugins'],
    deps: ['autoprefixer-rails', 'sassc-rails'],
    group: 'assets',
  },
  {
    name: 'sidekiq',
    desc: 'Background job processing with Redis',
    adds: ['Job queue system', 'Scheduled jobs', 'Web dashboard', 'Retry logic'],
    deps: ['redis-client', 'connection_pool'],
    group: 'main',
  },
]

const groupLabels: Record<string, string> = {
  main: 'default',
  test: ':test',
  assets: ':assets',
}

export default function GemManagerDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    devise: true, pg: true, puma: true, rspec_rails: false, bootstrap: false, sidekiq: false,
  })

  const toggle = (name: string) => {
    setEnabled((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const enabledGems = useMemo(() => gems.filter((g) => enabled[g.name]), [enabled])
  const allDeps = useMemo(() => {
    const deps = new Set<string>()
    enabledGems.forEach((g) => g.deps.forEach((d) => deps.add(d)))
    return Array.from(deps)
  }, [enabledGems])

  const gemfileLines = useMemo(() => {
    const lines: string[] = ["source 'https://rubygems.org'", '', 'gem \'rails\'', '\'']
    gems.forEach((g) => {
      if (enabled[g.name]) {
        const group = groupLabels[g.group]
        if (group === 'default') {
          lines.push(`gem '${g.name}'`)
        } else {
          lines.push(`gem '${g.name}', group: ${group}`)
        }
      }
    })
    if (allDeps.length > 0) {
      lines.push('')
      lines.push('# Auto-resolved dependencies')
      allDeps.forEach((d) => lines.push(`# ${d}`))
    }
    return lines
  }, [enabled, allDeps])

  const gemfileHtml = useMemo(() => Prism.highlight(gemfileLines.join('\n'), Prism.languages.ruby, 'ruby'), [gemfileLines])

  return (
    <DemoBoundary name="Gem Manager Demo">
      <div className="gmc" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 12 }}>
              Available Gems
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {gems.map((g) => {
                const on = enabled[g.name]
                return (
                  <div key={g.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: on ? s.bg3 + '60' : s.bg2,
                    border: `1px solid ${on ? s.green + '60' : s.border}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }} onClick={() => toggle(g.name)}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      background: on ? s.green : 'transparent',
                      border: `2px solid ${on ? s.green : s.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {on && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: on ? s.green : s.text, fontFamily: s.mono }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize: 11, color: s.text3, marginTop: 1 }}>
                        {g.desc}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, color: s.text3, fontFamily: s.mono,
                      background: s.bg, borderRadius: 4, padding: '2px 6px',
                    }}>
                      {groupLabels[g.group]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            {enabledGems.length > 0 ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 12 }}>
                  What Gets Added
                </div>
                {enabledGems.map((g) => (
                  <div key={g.name} style={{
                    marginBottom: 12, padding: 12, borderRadius: 8,
                    background: s.bg2, border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.accent, fontFamily: s.mono, marginBottom: 6 }}>
                      {g.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {g.adds.map((a) => (
                        <span key={a} style={{
                          fontSize: 11, color: s.text2, background: s.bg3,
                          borderRadius: 4, padding: '2px 8px', fontFamily: s.mono,
                        }}>
                          {a}
                        </span>
                      ))}
                    </div>
                    {g.deps.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: s.text3 }}>
                        Deps: {g.deps.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 40, textAlign: 'center', color: s.text3, fontSize: 13,
                background: s.bg2, borderRadius: 8, border: `1px dashed ${s.border}`,
              }}>
                Enable gems to see what they add
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 8 }}>
                Gemfile
              </div>
              <div style={{
                background: s.bg, borderRadius: 8, padding: 12,
                border: `1px solid ${s.border}`, maxHeight: 200, overflowY: 'auto',
              }}>
                <div style={{
                  fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre',
                }}>
                  <code dangerouslySetInnerHTML={{ __html: gemfileHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .gmc code .token.keyword { color: #f92672; }
        .gmc code .token.string, .gmc code .token.char, .gmc code .token.builtin, .gmc code .token.inserted { color: #e6db74; }
        .gmc code .token.number, .gmc code .token.constant, .gmc code .token.symbol, .gmc code .token.property, .gmc code .token.tag, .gmc code .token.boolean, .gmc code .token.deleted { color: #ae81ff; }
        .gmc code .token.selector, .gmc code .token.attr-name { color: #f92672; }
        .gmc code .token.attr-value, .gmc code .token.atrule { color: #e6db74; }
        .gmc code .token.function, .gmc code .token.class-name { color: #a6e22e; }
        .gmc code .token.operator, .gmc code .token.entity, .gmc code .token.url, .gmc code .token.punctuation { color: #f8f8f2; }
        .gmc code .token.comment, .gmc code .token.prolog, .gmc code .token.doctype, .gmc code .token.cdata { color: #75715e; font-style: italic; }
        .gmc code .token.parameter, .gmc code .token.variable, .gmc code .token.regex, .gmc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}

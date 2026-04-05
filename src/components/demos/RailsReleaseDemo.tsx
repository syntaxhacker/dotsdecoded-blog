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

interface Release {
  version: string
  year: string
  status: 'eol' | 'security' | 'stable' | 'current'
  features: string[]
  ruby: string
}

const releases: Release[] = [
  {
    version: '1.0', year: '2004', status: 'eol',
    features: ['Full MVC framework', 'Active Record ORM', 'Action Pack (controllers + views)', 'Built-in WEBrick server', 'Scaffolding generator', 'Active Support extensions'],
    ruby: '1.8.x',
  },
  {
    version: '2.0', year: '2007', status: 'eol',
    features: ['RESTful routing by default', 'MultiView (respond_to blocks)', 'Rails Engine (reusable components)', 'Authentication via acts_as_authenticated', 'JSON support', 'Mime types'],
    ruby: '1.8.6+',
  },
  {
    version: '3.0', year: '2010', status: 'eol',
    features: ['Asset Pipeline (Sprockets)', 'ActiveModel (validations extracted)', 'Unobtrusive JavaScript (UJS)', 'New query interface', 'Dependency management with Bundler', 'Action Mailer revamped'],
    ruby: '1.8.7+',
  },
  {
    version: '4.0', year: '2013', status: 'eol',
    features: ['Strong Parameters', 'Turbolinks', 'Russian Doll caching', 'Concerns (ActiveSupport::Concern)', 'Action Controller #render with :json', 'Background jobs via Active Job'],
    ruby: '1.9.3+',
  },
  {
    version: '5.0', year: '2016', status: 'eol',
    features: ['Action Cable (WebSockets)', 'API-only mode (rails-api merged)', 'ActiveRecord Attributes API', 'Rails Command (rails instead of rake)', 'Sprockets 3.x', 'Test runner built-in'],
    ruby: '2.2.2+',
  },
  {
    version: '6.0', year: '2019', status: 'eol',
    features: ['Action Mailbox (incoming email)', 'Action Text (rich text editing)', 'Parallel testing', 'Webpacker default for JS', 'Multiple database support', 'Zeitwerk autoloader'],
    ruby: '2.5.0+',
  },
  {
    version: '7.0', year: '2021', status: 'eol',
    features: ['Hotwire (Turbo + Stimulus)', 'Import Maps (no Node build)', 'Hash diff for Active Record', 'Identity cache', 'Strict keyword arguments', 'Error reporter'],
    ruby: '2.7.0+',
  },
  {
    version: '7.1', year: '2023', status: 'eol',
    features: ['Dockerfiles generated', 'Kamal for deployment', 'Solid Cache / Solid Queue / Solid Cable', 'Propshaft asset pipeline', 'Stricter auto-loading', 'Authentication generator'],
    ruby: '3.1.0+',
  },
  {
    version: '7.2', year: '2024', status: 'security',
    features: ['All Solid components default', 'Async query handling', 'Improved dev error pages', 'YJIT recommended', 'Performance improvements', 'Active Record normalization'],
    ruby: '3.1.0+',
  },
  {
    version: '8.0', year: '2024', status: 'current',
    features: ['Propshaft replaces Sprockets', 'Solid components fully integrated', 'Kamal 2 for deployment', 'SQLite default for dev', 'Mission Control for Active Job', 'HTTP asset caching', 'Ruby 3.2+ required'],
    ruby: '3.2.0+',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  eol: { label: 'End of Life', color: s.red, bg: s.red + '15' },
  security: { label: 'Security Only', color: s.yellow, bg: s.yellow + '15' },
  stable: { label: 'Stable', color: s.green, bg: s.green + '15' },
  current: { label: 'Current', color: s.accent, bg: s.accent + '15' },
}

export default function RailsReleaseDemo() {
  const [selected, setSelected] = useState<number>(releases.length - 1)

  const release = releases[selected]
  const cfg = statusConfig[release.status]

  const selectedData = useMemo(() => ({
    major: release.version.split('.')[0],
    minor: release.version.split('.')[1],
    patch: release.version.split('.')[2],
  }), [release])

  return (
    <DemoBoundary name="Rails Release Timeline">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          display: 'flex', gap: 2, marginBottom: 20,
          padding: '16px 8px',
          background: s.bg2,
          borderRadius: 10,
          border: `1px solid ${s.border}`,
          overflowX: 'auto',
        }}>
          {releases.map((r, i) => {
            const rc = statusConfig[r.status]
            const isActive = i === selected
            return (
              <div
                key={r.version}
                onClick={() => setSelected(i)}
                style={{
                  flex: '1 1 0',
                  minWidth: 56,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  padding: '8px 4px',
                  borderRadius: 8,
                  background: isActive ? rc.bg : 'transparent',
                  border: `1px solid ${isActive ? rc.color + '50' : 'transparent'}`,
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  fontFamily: s.mono,
                  color: isActive ? rc.color : s.text3,
                  marginBottom: 4,
                }}>
                  {r.version}
                </div>
                <div style={{
                  fontSize: 10, color: s.text3,
                }}>
                  {r.year}
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: rc.color,
                  margin: '6px auto 0',
                  opacity: isActive ? 1 : 0.4,
                }} />
              </div>
            )
          })}
        </div>

        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
            <div style={{
              padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 28, fontWeight: 800, color: cfg.color,
                fontFamily: s.mono, marginBottom: 6,
              }}>
                Rails {release.version}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 10px', borderRadius: 5,
                background: cfg.bg, border: `1px solid ${cfg.color}40`,
                fontSize: 11, fontWeight: 600, color: cfg.color,
                marginBottom: 12,
              }}>
                {cfg.label}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Released</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>{release.year}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ruby</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.text, fontFamily: s.mono }}>{release.ruby}</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Semantic Versioning
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'MAJOR', value: selectedData.major, color: s.red, desc: 'Breaking changes' },
                  { label: 'MINOR', value: selectedData.minor, color: s.yellow, desc: 'New features' },
                  { label: 'PATCH', value: selectedData.patch || '0', color: s.green, desc: 'Bug fixes' },
                ].map((part) => (
                  <div key={part.label} style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 24, fontWeight: 800, color: part.color,
                      fontFamily: s.mono, marginBottom: 2,
                    }}>
                      {part.value}
                    </div>
                    <div style={{ fontSize: 9, color: part.color, fontWeight: 600, letterSpacing: 0.5 }}>
                      {part.label}
                    </div>
                    <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>
                      {part.desc}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
                Format: MAJOR.MINOR.PATCH. Major versions can break backward compatibility. Minor versions add features. Patch versions fix bugs.
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Support Status Legend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color }} />
                    <span style={{ fontSize: 12, color: s.text2 }}>{val.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            <div style={{
              padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 12 }}>
                Key Features in Rails {release.version}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {release.features.map((f, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: cfg.color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: s.mono }}>
                        {i + 1}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: s.text2 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

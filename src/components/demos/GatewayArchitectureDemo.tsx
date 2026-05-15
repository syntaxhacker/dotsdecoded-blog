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

interface Comparison {
  label: string
  kong: string
  envoy: string
  aws: string
}

const comparisons: Comparison[] = [
  { label: 'Language', kong: 'Lua (OpenResty/Nginx)', envoy: 'C++', aws: 'Managed (AWS)' },
  { label: 'Config', kong: 'Admin API + declarative (DB or DB-less)', envoy: 'xDS API (dynamic) or static YAML', aws: 'REST API, CloudFormation, Terraform' },
  { label: 'Plugin System', kong: 'Lua plugins (PDK), 200+ community', envoy: 'C++ filters, WASM, Lua (limited)', aws: 'Built-in features, no custom plugins' },
  { label: 'Performance', kong: '~50K req/s per core (Nginx)', envoy: '~100K req/s per core (C++)', aws: 'Auto-scaling, managed (varies)' },
  { label: 'Deployment', kong: 'Docker, K8s, traditional', envoy: 'Sidecar (Istio), standalone', aws: 'Fully managed, regional' },
  { label: 'Service Mesh', kong: 'Kong Mesh (envoy-based)', envoy: 'Istio, Consul, App Mesh', aws: 'App Mesh (envoy-based)' },
  { label: 'Best For', kong: 'API management, developer portal', envoy: 'High perf, mesh, edge proxy', aws: 'Serverless, Lambda, managed infra' },
]

interface TabInfo {
  id: string
  name: string
  color: string
  desc: string
  archNote: string
  pros: string[]
  cons: string[]
}

const tabs: TabInfo[] = [
  {
    id: 'kong',
    name: 'Kong',
    color: s.accent,
    desc: 'Built on Nginx + OpenResty with Lua plugins. Mature API gateway with admin API, developer portal, and 200+ plugins.',
    archNote: 'Config stored in PostgreSQL/Cassandra or DB-less mode. Admin API enables hot-reload without restart.',
    pros: ['Rich plugin ecosystem', 'Admin API for dynamic config', 'Developer portal included', 'DB-less mode for K8s', 'Mature, battle-tested'],
    cons: ['Lua ecosystem is niche', 'Nginx worker model limits perf', 'Plugin chain can impact latency', 'Complex DB-backed deployment'],
  },
  {
    id: 'envoy',
    name: 'Envoy',
    color: s.green,
    desc: 'High-performance C++ proxy. Used as the data plane for Istio, Consul Connect, and AWS App Mesh.',
    archNote: 'Dynamic config via xDS API (CDS, EDS, RDS, LDS). Stateless -- config sourced externally from control plane.',
    pros: ['Extremely high throughput', 'xDS for dynamic config', 'Service mesh native', 'WASM filter support', 'Rich observability (stats, tracing)'],
    cons: ['Complex configuration', 'No native API management', 'Requires control plane for dynamic config', 'Steep learning curve', 'No developer portal'],
  },
  {
    id: 'aws',
    name: 'AWS API Gateway',
    color: s.orange,
    desc: 'Fully managed AWS service. Integrates with Lambda, ALB, CloudFront, and other AWS services.',
    archNote: 'Regional service. REST and HTTP APIs. Supports edge-optimized endpoints via CloudFront. Usage plans and API keys built in.',
    pros: ['Fully managed -- no ops', 'Auto-scales infinitely', 'Native Lambda integration', 'Usage plans and API keys', 'CloudFront edge optimization'],
    cons: ['Vendor lock-in', 'Limited customization', 'Cold start on Lambda integration', 'Cost at scale (per-request pricing)', 'No custom plugins'],
  },
]

export default function GatewayArchitectureDemo() {
  const [activeTab, setActiveTab] = useState('kong')

  const tab = tabs.find(t => t.id === activeTab)!

  return (
    <DemoBoundary name="Gateway Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={H}>Gateway Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          The full architecture: client to gateway to upstream. Compare Kong, Envoy, and AWS API Gateway.
        </p>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Client', color: s.text2 },
              { label: 'DNS', color: s.text3 },
              { label: 'LB', color: s.orange },
              { label: 'Gateway', color: s.accent },
              { label: 'Services', color: s.green },
            ].map((stg, i) => (
              <div key={stg.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: s.text3, fontSize: 16 }}>{'\u2192'}</span>}
                <div style={{
                  background: `${stg.color}15`, border: `1px solid ${stg.color}40`,
                  borderRadius: 8, padding: '8px 14px', textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                  <div style={{ color: stg.color, fontSize: 11, fontWeight: 600 }}>{stg.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Config Store</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'etcd / Consul', desc: 'Distributed KV for dynamic config' },
                  { label: 'Admin API', desc: 'REST API for CRUD on routes, services' },
                  { label: 'Declarative', desc: 'YAML / JSON config files' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: s.text, fontSize: 11, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: s.text3, fontSize: 10 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Plugin System</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Global plugins', desc: 'Applied to all routes' },
                  { label: 'Per-service plugins', desc: 'Applied to specific upstream' },
                  { label: 'Per-route plugins', desc: 'Applied to specific path match' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: s.text, fontSize: 11, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: s.text3, fontSize: 10 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
            {['Users Service', 'Orders Service', 'Payments Service'].map(svc => (
              <div key={svc} style={{
                background: `${s.green}12`, border: `1px solid ${s.green}30`,
                borderRadius: 8, padding: '8px 16px', textAlign: 'center',
              }}>
                <div style={{ color: s.green, fontSize: 10, fontWeight: 600 }}>{svc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, background: activeTab === t.id ? `${t.color}15` : s.bg3,
              border: `1px solid ${activeTab === t.id ? t.color : s.border}`,
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer', textAlign: 'center',
              outline: 'none', transition: 'all 0.2s',
            }}>
              <div style={{ color: activeTab === t.id ? t.color : s.text, fontSize: 13, fontWeight: 600 }}>{t.name}</div>
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: tab.color, flexShrink: 0,
            }} />
            <div style={{ color: tab.color, fontSize: 15, fontWeight: 700 }}>{tab.name}</div>
          </div>

          <p style={{ color: s.text2, fontSize: 12, lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {tab.desc}
          </p>

          <div style={{
            background: s.bg3, borderRadius: 8, padding: '10px 14px', marginBottom: 14,
            borderLeft: `3px solid ${tab.color}`,
          }}>
            <div style={{ color: tab.color, fontSize: 10, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
              Architecture Note
            </div>
            <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono, lineHeight: 1.5 }}>
              {tab.archNote}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ color: s.green, fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Pros</div>
              {tab.pros.map(pro => (
                <div key={pro} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
                  <div style={{ color: s.text2, fontSize: 11 }}>{pro}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: s.red, fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Cons</div>
              {tab.cons.map(con => (
                <div key={con} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.red, flexShrink: 0 }} />
                  <div style={{ color: s.text2, fontSize: 11 }}>{con}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Comparison Table
          </div>
          <div style={{ border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {comparisons.map((cmp, i) => (
              <div key={cmp.label} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr',
                borderBottom: i < comparisons.length - 1 ? `1px solid ${s.border}` : 'none',
                background: i % 2 === 0 ? s.bg3 : s.bg,
              }}>
                <div style={{ padding: '8px 12px', color: s.text, fontSize: 11, fontWeight: 600, borderRight: `1px solid ${s.border}` }}>
                  {cmp.label}
                </div>
                <div style={{
                  padding: '8px 12px', color: activeTab === 'kong' ? s.accent : s.text2, fontSize: 11,
                  borderRight: `1px solid ${s.border}`,
                }}>
                  {cmp.kong}
                </div>
                <div style={{
                  padding: '8px 12px', color: activeTab === 'envoy' ? s.green : s.text2, fontSize: 11,
                  borderRight: `1px solid ${s.border}`,
                }}>
                  {cmp.envoy}
                </div>
                <div style={{ padding: '8px 12px', color: activeTab === 'aws' ? s.orange : s.text2, fontSize: 11 }}>
                  {cmp.aws}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

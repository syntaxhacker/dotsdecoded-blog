import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Architecture = 'database' | 'schema' | 'shared'

interface TenantData {
  name: string
  users: { name: string; email: string }[]
}

const tenants: TenantData[] = [
  { name: 'Acme Corp', users: [{ name: 'Alice', email: 'alice@acme.com' }, { name: 'Bob', email: 'bob@acme.com' }] },
  { name: 'Globex Inc', users: [{ name: 'Carol', email: 'carol@globex.com' }, { name: 'Dave', email: 'dave@globex.com' }] },
  { name: 'Initech LLC', users: [{ name: 'Eve', email: 'eve@initech.com' }, { name: 'Frank', email: 'frank@initech.com' }] },
]

const archLabels: Record<Architecture, { label: string; desc: string; color: string }> = {
  database: { label: 'Database-per-Tenant', desc: 'Each tenant gets its own database. Maximum isolation, highest cost.', color: s.green },
  schema: { label: 'Schema-per-Tenant', desc: 'One database, separate PostgreSQL schemas per tenant. Good balance.', color: s.accent },
  shared: { label: 'Shared-Schema', desc: 'All tenants share one schema. Data separated by tenant_id column. Cheapest.', color: s.orange },
}

const archCode: Record<Architecture, string> = {
  database: `# database.yml (per-tenant)
acme:
  adapter: postgresql
  database: acme_production
  host: db-cluster-1

globex:
  adapter: postgresql
  database: globex_production
  host: db-cluster-1

# Switching tenant
def switch_tenant(name)
  ActiveRecord::Base
    .connection_handler
    .establish_connection(name.to_sym)
end

# All queries now go to
# the tenant's own database
User.all  # => SELECT * FROM users
         #    (runs on acme_production)`,

  schema: `# One database, many schemas
# acme_production DB:
#   - public schema (empty)
#   - acme schema    (tenant data)
#   - globex schema  (tenant data)

def set_tenant_schema(name)
  connection = ActiveRecord::Base.connection
  connection.execute(
    "SET search_path TO #{name}"
  )
end

# In a controller before_action
before_action :set_tenant

def set_tenant
  set_tenant_schema(
    current_user.tenant.schema_name
  )
end

# All queries scoped to schema
User.all
# => SELECT * FROM acme.users
#    (search_path = "acme")`,

  shared: `# One database, one schema
# tenant_id column on every table

class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  belongs_to :tenant
end

# Automatic scoping
class User < ApplicationRecord
  default_scope {
    where(tenant_id:
      Current.tenant&.id)
  }
end

# Every query auto-includes filter
User.all
# => SELECT * FROM users
#    WHERE tenant_id = 1

# Safety: prevents cross-tenant
# data leakage even if you forget
# to filter manually`,
}

export default function MultiTenancyDemo() {
  const [arch, setArch] = useState<Architecture>('database')
  const [selectedTenant, setSelectedTenant] = useState(0)
  const info = archLabels[arch]
  const tenant = tenants[selectedTenant]

  const codeHtml = useMemo(() => {
    return Prism.highlight(archCode[arch], Prism.languages.ruby, 'ruby')
  }, [arch])

  return (
    <DemoBoundary name="Multi-Tenancy Demo">
      <div className="mtc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.mtc code .token.keyword { color: #f92672; }
.mtc code .token.string, .mtc code .token.char, .mtc code .token.builtin, .mtc code .token.inserted { color: #e6db74; }
.mtc code .token.number, .mtc code .token.constant, .mtc code .token.symbol, .mtc code .token.property, .mtc code .token.tag, .mtc code .token.boolean, .mtc code .token.deleted { color: #ae81ff; }
.mtc code .token.selector, .mtc code .token.attr-name { color: #f92672; }
.mtc code .token.attr-value, .mtc code .token.atrule { color: #e6db74; }
.mtc code .token.function, .mtc code .token.class-name { color: #a6e22e; }
.mtc code .token.operator, .mtc code .token.entity, .mtc code .token.url, .mtc code .token.punctuation { color: #f8f8f2; }
.mtc code .token.comment, .mtc code .token.prolog, .mtc code .token.doctype, .mtc code .token.cdata { color: #75715e; font-style: italic; }
.mtc code .token.parameter, .mtc code .token.variable, .mtc code .token.regex, .mtc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['database', 'schema', 'shared'] as Architecture[]).map((a) => (
            <button
              key={a}
              onClick={() => setArch(a)}
              style={{
                background: arch === a ? archLabels[a].color : s.bg2,
                border: `1px solid ${arch === a ? archLabels[a].color : s.border}`,
                borderRadius: 6,
                padding: '6px 14px',
                color: arch === a ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {archLabels[a].label}
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 12px', background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ color: info.color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{info.label}</div>
          <div style={{ color: s.text2, fontSize: 12 }}>{info.desc}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {tenants.map((t, idx) => (
            <button
              key={t.name}
              onClick={() => setSelectedTenant(idx)}
              style={{
                background: selectedTenant === idx ? s.bg3 : s.bg2,
                border: `1px solid ${selectedTenant === idx ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '5px 12px',
                color: selectedTenant === idx ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Data Isolation Visualization
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
              {arch === 'database' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tenants.map((t, idx) => (
                    <div
                      key={t.name}
                      style={{
                        padding: '10px 12px',
                        background: idx === selectedTenant ? s.bg3 : 'transparent',
                        border: `1px solid ${idx === selectedTenant ? info.color : s.border}`,
                        borderRadius: 8,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: idx === 0 ? s.green : idx === 1 ? s.accent : s.orange }} />
                        <span style={{ color: s.text, fontSize: 12, fontFamily: s.mono, fontWeight: 600 }}>{t.name}</span>
                      </div>
                      <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, paddingLeft: 18 }}>
                        {t.name.toLowerCase().replace(/\s/g, '_')}_production
                      </div>
                      <div style={{ color: s.text2, fontSize: 10, fontFamily: s.mono, paddingLeft: 18, marginTop: 4 }}>
                        users: {t.users.map((u) => u.name).join(', ')}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, padding: '6px 10px', background: s.bg, borderRadius: 4, border: `1px dashed ${s.border}` }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, textAlign: 'center' }}>
                      Each tenant has a fully separate database -- no shared tables, no risk of cross-tenant access
                    </div>
                  </div>
                </div>
              )}
              {arch === 'schema' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
                    <div style={{ color: s.text, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>production_db</div>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>Single PostgreSQL database</div>
                  </div>
                  <div style={{ paddingLeft: 12, borderLeft: `2px solid ${s.border}` }}>
                    {tenants.map((t, idx) => (
                      <div
                        key={t.name}
                        style={{
                          padding: '8px 12px',
                          background: idx === selectedTenant ? s.bg3 : 'transparent',
                          border: `1px solid ${idx === selectedTenant ? info.color : s.border}`,
                          borderRadius: 6,
                          marginBottom: 6,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: idx === 0 ? s.green : idx === 1 ? s.accent : s.orange }} />
                          <span style={{ color: s.text, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>schema: {t.name.toLowerCase().replace(/\s/g, '_')}</span>
                        </div>
                        <div style={{ color: s.text2, fontSize: 10, fontFamily: s.mono, paddingLeft: 18, marginTop: 3 }}>
                          users: {t.users.map((u) => u.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, border: `1px dashed ${s.border}` }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, textAlign: 'center' }}>
                      SET search_path switches which schema receives queries -- schemas are isolated from each other
                    </div>
                  </div>
                </div>
              )}
              {arch === 'shared' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
                    <div style={{ color: s.text, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>production_db / public schema</div>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>All tenants share the same tables</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: s.bg3, borderRadius: 6, border: `1px solid ${s.border}` }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 6 }}>users table</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: s.mono, fontSize: 10 }}>
                      <thead>
                        <tr>
                          {['id', 'name', 'email', 'tenant_id'].map((h) => (
                            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: s.text3, borderBottom: `1px solid ${s.border}`, fontWeight: 600, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((t) =>
                          t.users.map((u, ui) => (
                            <tr key={`${t.name}-${u.name}`} style={{ background: tenants.indexOf(t) === selectedTenant ? `${info.color}11` : 'transparent' }}>
                              <td style={{ padding: '4px 8px', color: s.text2, borderBottom: `1px solid ${s.border}33` }}>{t.users.indexOf(u) * 3 + tenants.indexOf(t) * 2 + 1}</td>
                              <td style={{ padding: '4px 8px', color: s.text, borderBottom: `1px solid ${s.border}33` }}>{u.name}</td>
                              <td style={{ padding: '4px 8px', color: s.text2, borderBottom: `1px solid ${s.border}33` }}>{u.email}</td>
                              <td style={{ padding: '4px 8px', color: tenants.indexOf(t) === selectedTenant ? info.color : s.text3, borderBottom: `1px solid ${s.border}33`, fontWeight: 600 }}>{tenants.indexOf(t) + 1}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, border: `1px dashed ${s.border}` }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, textAlign: 'center' }}>
                      All rows live in one table. tenant_id column filters per-tenant. Forgetting the filter leaks data!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Implementation Code
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>
                <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {(['database', 'schema', 'shared'] as Architecture[]).map((a) => (
                <div
                  key={a}
                  style={{
                    padding: '10px',
                    background: a === arch ? s.bg3 : s.bg2,
                    border: `1px solid ${a === arch ? archLabels[a].color : s.border}`,
                    borderRadius: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ color: archLabels[a].color, fontSize: 10, fontFamily: s.mono, fontWeight: 600, marginBottom: 6 }}>
                    {archLabels[a].label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>Isolation: {a === 'database' ? 'Highest' : a === 'schema' ? 'High' : 'Low'}</div>
                    <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>Cost: {a === 'database' ? '$$$$' : a === 'schema' ? '$$' : '$'}</div>
                    <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>Complexity: {a === 'database' ? 'High' : a === 'schema' ? 'Medium' : 'Low'}</div>
                    <div style={{ color: s.text3, fontSize: 9, fontFamily: s.mono }}>Scale: {a === 'database' ? '~100' : a === 'schema' ? '~1,000' : '~10,000'}</div>
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

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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const rolesList = [
  { id: 'admin', label: 'Admin', color: s.red },
  { id: 'editor', label: 'Editor', color: s.orange },
  { id: 'viewer', label: 'Viewer', color: s.accent },
]

const resourcesList = [
  { id: 'users', label: 'Users', actions: ['Read', 'Create', 'Update', 'Delete'] },
  { id: 'posts', label: 'Posts', actions: ['Read', 'Create', 'Update', 'Delete'] },
  { id: 'settings', label: 'Settings', actions: ['Read', 'Update'] },
  { id: 'billing', label: 'Billing', actions: ['Read', 'Update'] },
]

const rbacMatrix: Record<string, Record<string, string[]>> = {
  admin: {
    users: ['Read', 'Create', 'Update', 'Delete'],
    posts: ['Read', 'Create', 'Update', 'Delete'],
    settings: ['Read', 'Update'],
    billing: ['Read', 'Update'],
  },
  editor: {
    users: ['Read'],
    posts: ['Read', 'Create', 'Update', 'Delete'],
    settings: ['Read'],
    billing: ['Read'],
  },
  viewer: {
    users: ['Read'],
    posts: ['Read'],
    settings: ['Read'],
    billing: ['Read'],
  },
}

const departments = ['engineering', 'marketing', 'sales', 'hr']

interface AbacCondition {
  attribute: string
  operator: string
  value: string
}

const defaultAbacConditions: AbacCondition[] = [
  { attribute: 'user.department', operator: '===', value: 'engineering' },
  { attribute: 'resource.owner', operator: '===', value: 'user.id' },
  { attribute: 'environment.time', operator: '<', value: '18:00' },
]

export default function RbacDemo() {
  const [selectedRole, setSelectedRole] = useState('admin')
  const [mode, setMode] = useState<'rbac' | 'abac'>('rbac')
  const [abacConditions, setAbacConditions] = useState<AbacCondition[]>(defaultAbacConditions)
  const [simUser, setSimUser] = useState({ department: 'engineering', id: 'user_42' })
  const [simResource, setSimResource] = useState({ owner: 'user_42' })
  const [simTime, setSimTime] = useState('14:30')
  const [evalResult, setEvalResult] = useState<string | null>(null)

  const currentPerms = rbacMatrix[selectedRole]
  const roleColor = rolesList.find(r => r.id === selectedRole)?.color ?? s.accent

  const evaluateAbac = () => {
    const results: string[] = []
    for (const cond of abacConditions) {
      let lhs: string
      if (cond.attribute === 'user.department') lhs = simUser.department
      else if (cond.attribute === 'resource.owner') lhs = simResource.owner
      else if (cond.attribute === 'environment.time') lhs = simTime
      else lhs = ''

      let rhs = cond.value
      if (rhs === 'user.id') rhs = simUser.id

      let pass = false
      if (cond.operator === '===') pass = lhs === rhs
      else if (cond.operator === '!==') pass = lhs !== rhs
      else if (cond.operator === '<') pass = lhs < rhs
      else if (cond.operator === '>') pass = lhs > rhs

      results.push(`${cond.attribute} ${cond.operator} "${rhs}" \u2192 ${pass ? 'ALLOW' : 'DENY'}`)
    }
    setEvalResult(results.join('\n'))
  }

  return (
    <DemoBoundary name="RBAC vs ABAC Access Control">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>RBAC vs ABAC Access Control</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Select a role to see its permissions, then toggle to ABAC mode to evaluate attribute-based policies.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setMode('rbac'); setEvalResult(null) }} style={modeBtn(mode === 'rbac', s.accent)}>
            RBAC
          </button>
          <button onClick={() => { setMode('abac'); setEvalResult(null) }} style={modeBtn(mode === 'abac', s.purple)}>
            ABAC
          </button>
        </div>

        {mode === 'rbac' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {rolesList.map((role) => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)} style={roleBtn(selectedRole === role.id, role.color)}>
                  {role.label}
                </button>
              ))}
            </div>

            <div style={{ overflow: 'auto', marginBottom: 16 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Resource</th>
                    {Array.from(new Set(resourcesList.flatMap(r => r.actions))).map(action => (
                      <th key={action} style={thStyle}>{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resourcesList.map(resource => (
                    <tr key={resource.id}>
                      <td style={{ ...tdStyle, color: s.text, fontWeight: 600 }}>{resource.label}</td>
                      {Array.from(new Set(resourcesList.flatMap(r => r.actions))).map(action => {
                        const allowed = currentPerms[resource.id]?.includes(action) ?? false
                        return (
                          <td key={action} style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: allowed ? `${roleColor}20` : s.bg3,
                              border: `1px solid ${allowed ? roleColor : s.border}`,
                              color: allowed ? roleColor : s.text3,
                              fontWeight: 700, fontSize: 14,
                            }}>
                              {allowed ? '\u2713' : '\u2013'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: `${roleColor}10`, border: `1px solid ${roleColor}30`, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ color: roleColor, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {rolesList.find(r => r.id === selectedRole)?.label} Role
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
                {selectedRole === 'admin' && 'Full access to all resources. Can read, create, update, and delete users, posts, settings, and billing. Typically granted to system administrators only.'}
                {selectedRole === 'editor' && 'Can manage posts (full CRUD) and read users, settings, and billing. Cannot create users or modify settings. Typical for content managers.'}
                {selectedRole === 'viewer' && 'Read-only access to all resources. Cannot create, update, or delete anything. Typical for auditors or new team members.'}
              </div>
            </div>
          </>
        )}

        {mode === 'abac' && (
          <>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Policy Conditions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {abacConditions.map((cond, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: s.mono, fontSize: 12 }}>
                    <select value={cond.attribute} onChange={e => {
                      const next = [...abacConditions]; next[idx] = { ...next[idx], attribute: e.target.value }; setAbacConditions(next)
                    }} style={selectStyle()}>
                      <option value="user.department">user.department</option>
                      <option value="resource.owner">resource.owner</option>
                      <option value="environment.time">environment.time</option>
                    </select>
                    <select value={cond.operator} onChange={e => {
                      const next = [...abacConditions]; next[idx] = { ...next[idx], operator: e.target.value }; setAbacConditions(next)
                    }} style={selectStyle()}>
                      <option value="===">===</option>
                      <option value="!==">!==</option>
                      <option value="<">&lt;</option>
                      <option value=">">&gt;</option>
                    </select>
                    <select value={cond.value} onChange={e => {
                      const next = [...abacConditions]; next[idx] = { ...next[idx], value: e.target.value }; setAbacConditions(next)
                    }} style={selectStyle()}>
                      <option value="engineering">engineering</option>
                      <option value="marketing">marketing</option>
                      <option value="sales">sales</option>
                      <option value="hr">hr</option>
                      <option value="user.id">user.id</option>
                      <option value="18:00">18:00</option>
                    </select>
                    <button onClick={() => setAbacConditions(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: s.red, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>&times;</button>
                  </div>
                ))}
                <button onClick={() => setAbacConditions(prev => [...prev, { attribute: 'user.department', operator: '===', value: 'engineering' }])} style={addBtnStyle()}>
                  + Add Condition
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140, background: s.bg3, borderRadius: 8, padding: 12 }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Simulated Context</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, minWidth: 80 }}>department:</span>
                    <select value={simUser.department} onChange={e => setSimUser(prev => ({ ...prev, department: e.target.value }))} style={selectStyle()}>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, minWidth: 80 }}>resource.own:</span>
                    <select value={simResource.owner} onChange={e => setSimResource(prev => ({ ...prev, owner: e.target.value }))} style={selectStyle()}>
                      <option value="user_42">user_42 (self)</option>
                      <option value="user_99">user_99 (other)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, minWidth: 80 }}>time:</span>
                    <input type="text" value={simTime} onChange={e => setSimTime(e.target.value)} style={inputStyle()} />
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <button onClick={evaluateAbac} style={{
                  background: `${s.purple}18`, border: `1px solid ${s.purple}`, borderRadius: 8,
                  padding: '10px 20px', color: s.purple, cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%',
                }}>
                  Evaluate Policy
                </button>
              </div>
            </div>

            {evalResult && (
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, fontFamily: s.mono, fontSize: 12, lineHeight: 1.8 }}>
                {evalResult.split('\n').map((line, idx) => {
                  const isAllow = line.includes('ALLOW')
                  return (
                    <div key={idx} style={{ color: isAllow ? s.green : s.red }}>
                      {line}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </DemoBoundary>
  )

  function modeBtn(active: boolean, color: string): React.CSSProperties {
    return { background: active ? color : s.bg3, border: `1px solid ${active ? color : s.border}`, borderRadius: 8, padding: '8px 20px', color: active ? '#fff' : s.text3, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }
  }

  function roleBtn(active: boolean, color: string): React.CSSProperties {
    return { background: active ? `${color}18` : s.bg3, border: `1px solid ${active ? color : s.border}`, borderRadius: 8, padding: '8px 16px', color: active ? color : s.text3, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }
  }

  function selectStyle(): React.CSSProperties {
    return { background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 8px', color: s.text2, fontFamily: s.mono, fontSize: 11, cursor: 'pointer' }
  }

  function inputStyle(): React.CSSProperties {
    return { background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 8px', color: s.text2, fontFamily: s.mono, fontSize: 11, width: 80 }
  }

  function addBtnStyle(): React.CSSProperties {
    return { background: 'none', border: `1px dashed ${s.border}`, borderRadius: 6, padding: '6px 12px', color: s.text3, cursor: 'pointer', fontSize: 12 }
  }
}

const thStyle: React.CSSProperties = { padding: '8px 12px', color: s.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${s.border}` }
const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${s.border}30` }

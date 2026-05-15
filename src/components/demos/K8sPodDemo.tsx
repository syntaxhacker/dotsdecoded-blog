import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-yaml'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const yamlLines = [
  { num: 1, code: 'apiVersion: v1', field: null as string | null },
  { num: 2, code: 'kind: Pod', field: null },
  { num: 3, code: 'metadata:', field: null },
  { num: 4, code: '  name: my-pod', field: 'name' },
  { num: 5, code: '  labels:', field: 'labels' },
  { num: 6, code: '    app: web', field: 'labels' },
  { num: 7, code: 'spec:', field: null },
  { num: 8, code: '  containers:', field: 'containers' },
  { num: 9, code: '  - name: app', field: 'containers' },
  { num: 10, code: '    image: nginx:latest', field: 'containers' },
  { num: 11, code: '    ports:', field: 'containers' },
  { num: 12, code: '    - containerPort: 80', field: 'containers' },
  { num: 13, code: '  volumes:', field: 'volumes' },
  { num: 14, code: '  - name: data', field: 'volumes' },
  { num: 15, code: '    emptyDir: {}', field: 'volumes' },
  { num: 16, code: '  restartPolicy: Always', field: 'restartPolicy' },
]

const fieldDescriptions: Record<string, { title: string; desc: string; color: string }> = {
  name: { title: 'Pod Name', desc: 'Each Pod has a unique name within the namespace. Used for DNS resolution and logging identification.', color: s.accent },
  labels: { title: 'Labels', desc: 'Key-value pairs attached to the Pod. Services and Deployments use label selectors to find which Pods to target.', color: s.green },
  containers: { title: 'Containers', desc: 'Application processes running inside the Pod. Each container has its own image, ports, environment, and resource limits. Containers in the same Pod share the network namespace and can communicate via localhost.', color: s.yellow },
  volumes: { title: 'Volumes', desc: 'Storage attached to the Pod, accessible by all containers. Volumes outlive container restarts but share the Pod lifecycle. Types include emptyDir, hostPath, configMap, secret, and persistentVolumeClaim.', color: s.purple },
  restartPolicy: { title: 'Restart Policy', desc: 'Always: restart on any exit (default). OnFailure: restart only on non-zero exit. Never: never restart. The kubelet enforces this policy.', color: s.orange },
}

const fields = ['name', 'labels', 'containers', 'volumes', 'restartPolicy'] as const

export default function K8sPodDemo() {
  const [activeField, setActiveField] = useState<string | null>(null)

  const highlighted = useMemo(() => {
    const map: Record<number, string> = {}
    for (const line of yamlLines) {
      map[line.num] = Prism.highlight(line.code, Prism.languages.yaml, 'yaml')
    }
    return map
  }, [])

  const fieldGroup: Record<string, number[]> = {}
  for (const line of yamlLines) {
    if (line.field) {
      if (!fieldGroup[line.field]) fieldGroup[line.field] = []
      fieldGroup[line.field].push(line.num)
    }
  }

  return (
    <DemoBoundary name="Pod Anatomy">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <style>{`
        .k8s-pod code .token.keyword { color: #f92672; }
        .k8s-pod code .token.string, .k8s-pod code .token.char, .k8s-pod code .token.builtin, .k8s-pod code .token.inserted { color: #e6db74; }
        .k8s-pod code .token.number, .k8s-pod code .token.constant, .k8s-pod code .token.symbol, .k8s-pod code .token.property, .k8s-pod code .token.tag, .k8s-pod code .token.boolean, .k8s-pod code .token.deleted { color: #ae81ff; }
        .k8s-pod code .token.selector, .k8s-pod code .token.attr-name { color: #f92672; }
        .k8s-pod code .token.attr-value, .k8s-pod code .token.atrule { color: #e6db74; }
        .k8s-pod code .token.function, .k8s-pod code .token.class-name { color: #a6e22e; }
        .k8s-pod code .token.operator, .k8s-pod code .token.entity, .k8s-pod code .token.url, .k8s-pod code .token.punctuation { color: #f8f8f2; }
        .k8s-pod code .token.comment, .k8s-pod code .token.prolog, .k8s-pod code .token.doctype, .k8s-pod code .token.cdata { color: #75715e; font-style: italic; }
        .k8s-pod code .token.parameter, .k8s-pod code .token.variable, .k8s-pod code .token.regex, .k8s-pod code .token.important { color: #fd971f; }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Pod Anatomy</div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', minWidth: 240 }} className="k8s-pod">
          <div style={{ color: s.text2, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pod Spec YAML</div>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 0', overflow: 'hidden' }}>
            {yamlLines.map((line) => (
              <div key={line.num} style={{
                display: 'flex',
                background: line.field && activeField === line.field ? `${s.accent}15` : 'transparent',
                borderLeft: `3px solid ${line.field && activeField === line.field ? s.accent : 'transparent'}`,
                cursor: line.field ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
                onClick={() => line.field && setActiveField(line.field)}
                onMouseEnter={() => line.field && setActiveField(line.field)}
              >
                <div style={{
                  width: 36, textAlign: 'right', paddingRight: 8, flexShrink: 0,
                  color: activeField === line.field ? s.accent : s.text3,
                  fontFamily: s.mono, fontSize: 12, lineHeight: '22px', userSelect: 'none',
                  transition: 'color 0.2s',
                }}>{line.num}</div>
                <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 13, lineHeight: '22px' }} dangerouslySetInnerHTML={{ __html: highlighted[line.num] }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 240 }}>
          <div style={{ color: s.text2, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Visual Diagram</div>
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
            padding: 20, minHeight: 320, position: 'relative',
          }}>
            <div style={{
              border: `2px solid ${activeField === 'name' ? s.accent : s.border2}`,
              borderRadius: 12, padding: 20, transition: 'border-color 0.3s',
              background: activeField === 'name' ? `${s.accent}08` : 'transparent',
            }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Pod: my-pod</div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {[{ k: 'app', v: 'web', color: s.green }].map((st) => (
                  <span key={st.k} style={{
                    background: activeField === 'labels' ? `${st.color}20` : s.bg3,
                    border: `1px solid ${activeField === 'labels' ? st.color : s.border}`,
                    borderRadius: 4, padding: '2px 8px',
                    fontFamily: s.mono, fontSize: 11, color: activeField === 'labels' ? st.color : s.text2,
                    transition: 'all 0.3s',
                  }}>{st.k}={st.v}</span>
                ))}
              </div>

              <div style={{
                border: `2px solid ${activeField === 'containers' ? s.yellow : s.border}`,
                borderRadius: 8, padding: 12, marginBottom: 12,
                background: activeField === 'containers' ? `${s.yellow}08` : s.bg,
                transition: 'all 0.3s',
              }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Container: app</div>
                <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginBottom: 4 }}>nginx:latest</div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Port: 80/TCP</div>
              </div>

              <div style={{
                border: `2px solid ${activeField === 'volumes' ? s.purple : s.border}`,
                borderRadius: 8, padding: 12, marginBottom: 12,
                background: activeField === 'volumes' ? `${s.purple}08` : s.bg,
                transition: 'all 0.3s',
              }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Volume: data</div>
                <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text }}>emptyDir</div>
              </div>

              <div style={{
                border: `1px solid ${activeField === 'restartPolicy' ? s.orange : s.border}`,
                borderRadius: 6, padding: '6px 12px', display: 'inline-block',
                background: activeField === 'restartPolicy' ? `${s.orange}08` : s.bg,
                transition: 'all 0.3s',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: activeField === 'restartPolicy' ? s.orange : s.text3 }}>restartPolicy: Always</span>
              </div>
            </div>
          </div>

          {activeField && fieldDescriptions[activeField] && (
            <div style={{
              marginTop: 12, background: s.bg2, border: `1px solid ${fieldDescriptions[activeField].color}`,
              borderRadius: 8, padding: 12,
            }}>
              <div style={{ color: fieldDescriptions[activeField].color, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {fieldDescriptions[activeField].title}
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                {fieldDescriptions[activeField].desc}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        {fields.map((f) => (
          <button key={f} onClick={() => setActiveField(activeField === f ? null : f)} style={{
            background: activeField === f ? `${fieldDescriptions[f].color}20` : s.bg2,
            border: `1px solid ${activeField === f ? fieldDescriptions[f].color : s.border}`,
            borderRadius: 6, padding: '6px 14px',
            color: activeField === f ? fieldDescriptions[f].color : s.text2,
            cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
            transition: 'all 0.15s',
          }}>
            {f}
          </button>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}

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

interface Step {
  label: string
  desc: string
  from: string
  to: string
  highlight: string[]
}

const controlPlaneComponents = [
  { id: 'apiserver', label: 'kube-apiserver', short: 'API Server', color: s.accent },
  { id: 'etcd', label: 'etcd', short: 'etcd', color: s.purple },
  { id: 'scheduler', label: 'kube-scheduler', short: 'Scheduler', color: s.green },
  { id: 'controller', label: 'kube-controller-manager', short: 'Controller Mgr', color: s.orange },
]

const workerComponents = [
  { id: 'kubelet', label: 'kubelet', short: 'kubelet', color: s.accent },
  { id: 'kubeproxy', label: 'kube-proxy', short: 'kube-proxy', color: s.purple },
  { id: 'runtime', label: 'Container Runtime', short: 'Runtime', color: s.green },
]

const steps: Step[] = [
  {
    label: 'kubectl -> API Server',
    desc: 'User runs "kubectl apply -f pod.yaml". kubectl sends an HTTP POST to the kube-apiserver with the Pod manifest. The API server authenticates the request, validates the resource schema, and creates a Pod object in the cluster store.',
    from: 'kubectl', to: 'apiserver', highlight: ['apiserver'],
  },
  {
    label: 'API Server -> etcd',
    desc: 'The API server persists the Pod object to etcd, the cluster\'s distributed key-value store. etcd stores all cluster state reliably using the Raft consensus protocol.',
    from: 'apiserver', to: 'etcd', highlight: ['apiserver', 'etcd'],
  },
  {
    label: 'Scheduler Watches',
    desc: 'The kube-scheduler watches the API server for newly created Pods that have no node assignment (nodeName is empty). It detects our Pod and begins the scheduling process.',
    from: 'apiserver', to: 'scheduler', highlight: ['scheduler'],
  },
  {
    label: 'Scheduler Filters and Scores',
    desc: 'The scheduler runs filtering (predicates) to find candidate nodes, then scores each node using priority functions. It picks the best node and creates a Binding object in the API server.',
    from: 'scheduler', to: 'apiserver', highlight: ['scheduler', 'apiserver'],
  },
  {
    label: 'API Server Updates etcd',
    desc: 'The API server persists the Binding (pod-to-node assignment) in etcd. The Pod spec is updated with the assigned nodeName.',
    from: 'apiserver', to: 'etcd', highlight: ['apiserver', 'etcd'],
  },
  {
    label: 'kubelet Detects Pod',
    desc: 'The kubelet on the assigned worker node watches the API server for Pods scheduled to its node. It sees the new Pod and begins preparing to run it.',
    from: 'apiserver', to: 'kubelet', highlight: ['kubelet'],
  },
  {
    label: 'kubelet -> Container Runtime',
    desc: 'The kubelet instructs the container runtime (containerd, CRI-O) to pull the container image and start the container. The kubelet also sets up networking via CNI and mounts volumes.',
    from: 'kubelet', to: 'runtime', highlight: ['kubelet', 'runtime'],
  },
]

export default function K8sArchitectureDemo() {
  const [activeStep, setActiveStep] = useState(-1)

  const currentStep = activeStep >= 0 && activeStep < steps.length ? steps[activeStep] : null

  return (
    <DemoBoundary name="Cluster Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Cluster Architecture</div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20, marginBottom: 20,
      }}>
        <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Control Plane</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {controlPlaneComponents.map((comp) => {
            const isHighlighted = currentStep ? currentStep.highlight.includes(comp.id) : false
            return (
              <div key={comp.id} style={{
                background: isHighlighted ? `${comp.color}15` : s.bg,
                border: `2px solid ${isHighlighted ? comp.color : s.border}`,
                borderRadius: 8, padding: '10px 14px', textAlign: 'center',
                minWidth: 100, transition: 'all 0.3s',
                boxShadow: isHighlighted ? `0 0 12px ${comp.color}40` : 'none',
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: isHighlighted ? comp.color : s.text, fontWeight: 600 }}>
                  {comp.short}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', margin: '10px 0', color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
          |
        </div>
        <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Worker Node</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {workerComponents.map((comp) => {
            const isHighlighted = currentStep ? currentStep.highlight.includes(comp.id) : false
            return (
              <div key={comp.id} style={{
                background: isHighlighted ? `${comp.color}15` : s.bg,
                border: `2px solid ${isHighlighted ? comp.color : s.border}`,
                borderRadius: 8, padding: '10px 14px', textAlign: 'center',
                minWidth: 100, transition: 'all 0.3s',
                boxShadow: isHighlighted ? `0 0 12px ${comp.color}40` : 'none',
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: isHighlighted ? comp.color : s.text, fontWeight: 600 }}>
                  {comp.short}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 8,
        padding: '12px 16px', marginBottom: 16, minHeight: 80,
        transition: 'all 0.3s',
      }}>
        {currentStep ? (
          <>
            <div style={{ color: s.accent, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Step {activeStep + 1}: {currentStep.label}
            </div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
              {currentStep.desc}
            </div>
          </>
        ) : (
          <div style={{ color: s.text3, fontSize: 12 }}>
            Click "Next Step" to trace a Pod creation request through the cluster.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {activeStep < steps.length - 1 && (
          <button onClick={() => setActiveStep(prev => prev + 1)} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            {activeStep === -1 ? 'Start Flow' : 'Next Step'}
          </button>
        )}
        {activeStep >= 0 && (
          <button onClick={() => setActiveStep(-1)} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
        )}
      </div>

      <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Flow Steps</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {steps.map((st, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: s.mono, fontSize: 11, fontWeight: 600,
              background: i <= activeStep ? s.accent : s.bg3,
              color: i <= activeStep ? '#fff' : s.text3,
              cursor: 'pointer', transition: 'all 0.3s',
              border: `1px solid ${i <= activeStep ? s.accent : s.border}`,
            }} onClick={() => setActiveStep(i)}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

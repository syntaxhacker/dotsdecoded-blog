import { useState, useEffect, useRef, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const sdkCode = `import { AgentSDK } from '@anthropic-ai/agent-sdk'

const agent = new AgentSDK({
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY,
  hooks: {
    onInit: () => console.log('SDK ready'),
    onToolUse: (tool) => approveTool(tool),
    onStream: (chunk) => process.stdout.write(chunk),
  },
  permissions: {
    allow: ['Read', 'Glob', 'Grep'],
    deny: ['Write', 'Bash'],
  },
})

const result = await agent.run(
  'Refactor the auth module to use middleware'
)

console.log(result.summary)
console.log(\`Cost: $\${result.usage.costUSD}\`)`

type EventType = 'init' | 'stream' | 'tool_use' | 'hook' | 'permission' | 'result'

interface LogEntry {
  id: number
  type: EventType
  label: string
  payload: string
  color: string
}

const STREAM_CHUNKS = [
  "I'll refactor the auth module by extracting the",
  ' authentication logic into a middleware pattern.',
  '\n\nFirst, let me examine the current structure...',
]

const TOOL_EVENTS = [
  { tool: 'Read', args: 'src/auth/handler.ts', output: 'export async function handleAuth(req, res) {\n  const token = req.headers.authorization\n  const user = await verify(token)\n  // ... 47 more lines\n}' },
  { tool: 'Read', args: 'src/routes/protected.ts', output: 'import { handleAuth } from "../auth/handler"\n\nrouter.get("/dashboard", async (req, res) => {\n  await handleAuth(req, res)\n  // route logic\n})' },
  { tool: 'Glob', args: 'src/routes/*.ts', output: 'src/routes/index.ts\nsrc/routes/protected.ts\nsrc/routes/admin.ts\nsrc/routes/api.ts' },
]

const HOOK_EVENTS = [
  { hook: 'onInit', detail: 'SDK initialized — model: claude-sonnet-4-20250514, permissions: 3 allowed, 2 denied' },
  { hook: 'onTurnStart', detail: 'Turn 1/1 — processing user prompt' },
  { hook: 'onToolUse', detail: 'Intercepted tool call: Read — checking permission policy' },
]

const prismTokens: Record<string, string> = {
  'token.keyword': '#f92672',
  'token.string': '#e6db74',
  'token.number': '#ae81ff',
  'token.comment': '#75715e',
  'token.function': '#a6e22e',
  'token.class-name': '#a6e22e',
  'token.operator': '#f8f8f2',
  'token.punctuation': '#f8f8f2',
  'token.parameter': '#fd971f',
  'token.property': '#ae81ff',
  'token.boolean': '#ae81ff',
  'token.constant': '#ae81ff',
  'token.builtin': '#e6db74',
  'token.variable': '#fd971f',
  'token.tag': '#ae81ff',
  'token.attr-name': '#f92672',
  'token.attr-value': '#e6db74',
  'token.selector': '#a6e22e',
  'token.atrule': '#f92672',
  'token.regex': '#fd971f',
  'token.important': '#fd971f',
}

function AgentSdkDemoInner() {
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [phase, setPhase] = useState<'idle' | 'permission' | 'done'>('idle')
  const [permissionDecision, setPermissionDecision] = useState<'approved' | 'denied' | null>(null)
  const [metrics, setMetrics] = useState<Record<string, string> | null>(null)
  const [currentLine, setCurrentLine] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)

  const highlightedHtml = useMemo(() => {
    return Prism.highlight(sdkCode, Prism.languages.typescript, 'typescript')
  }, [])

  const addLog = (type: EventType, label: string, payload: string, color: string) => {
    const id = nextId.current++
    setLogs(prev => [...prev, { id, type, label, payload, color }])
  }

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const codeLines = sdkCode.split('\n')
  const highlightedLines = highlightedHtml.split('\n')

  const highlightLine = (idx: number) => {
    setCurrentLine(idx)
  }

  const run = async () => {
    setRunning(true)
    setLogs([])
    setPhase('idle')
    setPermissionDecision(null)
    setMetrics(null)
    setCurrentLine(-1)
    nextId.current = 0

    const wait = (ms: number) => new Promise(r => setTimeout(r, getStepDelay(ms, speed)))

    await wait(400)

    highlightLine(3)
    addLog('hook', 'onInit', HOOK_EVENTS[0].detail, s.purple)
    await wait(600)

    addLog('init', 'agent.init()', '{ model: "claude-sonnet-4-20250514", contextWindow: 200000 }', s.accent)
    await wait(500)

    highlightLine(15)
    addLog('hook', 'onTurnStart', HOOK_EVENTS[1].detail, s.purple)
    await wait(700)

    highlightLine(20)
    for (let i = 0; i < STREAM_CHUNKS.length; i++) {
      addLog('stream', `text.delta [${i + 1}/${STREAM_CHUNKS.length}]`, STREAM_CHUNKS[i], s.text2)
      await wait(350)
    }
    await wait(500)

    for (let i = 0; i < TOOL_EVENTS.length; i++) {
      const ev = TOOL_EVENTS[i]
      highlightLine(6)
      addLog('hook', 'onToolUse', HOOK_EVENTS[2].detail, s.purple)
      await wait(300)

      addLog('tool_use', `${ev.tool}(${ev.args})`, ev.output, s.yellow)
      await wait(600)

      addLog('tool_use', `${ev.tool}.result`, `${ev.output.split('\n').length} lines read`, s.green)
      await wait(500)
    }
    await wait(400)

    addLog('permission', 'permission.request', 'Tool: Write(path: "src/middleware/auth.ts")\nNot in allow list — host approval required', s.orange)
    setPhase('permission')
  }

  const handlePermission = async (approved: boolean) => {
    setPermissionDecision(approved ? 'approved' : 'denied')
    const wait = (ms: number) => new Promise(r => setTimeout(r, getStepDelay(ms, speed)))

    if (approved) {
      addLog('permission', 'permission.approved', 'Host granted Write permission for this call', s.green)
    } else {
      addLog('permission', 'permission.denied', 'Host denied Write permission — agent will skip file writes', s.red)
    }
    await wait(800)

    const finalChunks = approved
      ? ["I'll create the middleware file now...", ' Writing src/middleware/auth.ts... done.']
      : ['Skipping file writes per permission denial.', ' I will describe the changes instead.']

    highlightLine(20)
    for (const chunk of finalChunks) {
      addLog('stream', 'text.delta', chunk, s.text2)
      await wait(400)
    }
    await wait(600)

    highlightLine(22)
    addLog('result', 'agent.run() complete', '', s.green)
    await wait(300)

    setMetrics({
      'Model': 'claude-sonnet-4-20250514',
      'Duration': '4.2s',
      'Input tokens': '1,847',
      'Output tokens': '623',
      'Cache reads': '892',
      'Cache writes': '1,847',
      'Total cost': '$0.0084',
      'Turns': '1',
      'Tool calls': '3',
      'Permission checks': '1',
    })
    setPhase('done')
    setRunning(false)
  }

  const typeColor = (t: EventType) => {
    switch (t) {
      case 'init': return s.accent
      case 'stream': return s.text3
      case 'tool_use': return s.yellow
      case 'hook': return s.purple
      case 'permission': return s.orange
      case 'result': return s.green
    }
  }

  const reset = () => {
    setRunning(false)
    setLogs([])
    setPhase('idle')
    setPermissionDecision(null)
    setMetrics(null)
    setCurrentLine(-1)
    nextId.current = 0
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={running ? undefined : phase === 'idle' ? run : reset}
          disabled={running}
          style={{
            padding: '8px 18px',
            background: running ? s.bg3 : phase === 'done' ? s.bg3 : s.accent,
            color: running ? s.text3 : phase === 'done' ? s.text2 : '#fff',
            border: `1px solid ${running ? s.border : phase === 'done' ? s.border : s.accent}`,
            borderRadius: 6,
            cursor: running ? 'not-allowed' : 'pointer',
            fontFamily: s.mono,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {phase === 'done' ? 'Reset' : running ? 'Running...' : 'Run SDK'}
        </button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
        {running && phase !== 'permission' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green, animation: 'pulse 1s infinite' }} />
            <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>Processing</span>
          </div>
        )}
        {phase === 'done' && (
          <span style={{ color: s.green, fontSize: 12, fontFamily: s.mono }}>Complete</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginLeft: 4 }}>agent-sdk-demo.ts</span>
          </div>
          <div style={{ padding: '12px 0', overflow: 'auto', maxHeight: 380 }}>
            {codeLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1px 12px 1px 0',
                  background: currentLine === idx ? 'rgba(91, 141, 239, 0.1)' : 'transparent',
                  borderLeft: currentLine === idx ? `2px solid ${s.accent}` : '2px solid transparent',
                  display: 'flex',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ width: 40, textAlign: 'right', paddingRight: 12, color: s.text3, fontSize: 11, fontFamily: s.mono, userSelect: 'none', flexShrink: 0 }}>{idx + 1}</span>
                <code
                  style={{ margin: 0, fontFamily: s.mono, fontSize: 11.5, lineHeight: '20px', whiteSpace: 'pre', overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: highlightedLines[idx] || '' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>EVENT LOG</span>
            {logs.length > 0 && (
              <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>{logs.length} events</span>
            )}
          </div>
          <div ref={logRef} style={{ padding: 8, overflowY: 'auto', maxHeight: 356, flex: 1 }}>
            {logs.length === 0 && (
              <div style={{ padding: '20px 12px', color: s.text3, fontSize: 12, fontFamily: s.mono, textAlign: 'center' }}>
                Click "Run SDK" to start the event stream
              </div>
            )}
            {logs.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 6, padding: '6px 8px', background: s.bg2, borderRadius: 4, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontFamily: s.mono, fontWeight: 700, color: typeColor(entry.type), background: `${typeColor(entry.type)}18`, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{entry.type}</span>
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: entry.color }}>{entry.label}</span>
                </div>
                <pre style={{ margin: 0, fontFamily: s.mono, fontSize: 10.5, lineHeight: '16px', color: s.text2, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{entry.payload}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {phase === 'permission' && !permissionDecision && (
        <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.orange}`, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.orange, marginBottom: 4, fontFamily: s.mono }}>Permission Request</div>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 12, lineHeight: '18px' }}>
            Claude wants to call <code style={{ fontFamily: s.mono, background: s.bg3, padding: '1px 5px', borderRadius: 3, color: s.yellow }}>Write(path: "src/middleware/auth.ts")</code>.
            This tool is not in your allow list. Approve or deny this call.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handlePermission(true)}
              style={{
                padding: '6px 16px', background: s.green, color: s.bg, border: 'none',
                borderRadius: 5, cursor: 'pointer', fontFamily: s.mono, fontSize: 12, fontWeight: 700,
              }}
            >
              Approve
            </button>
            <button
              onClick={() => handlePermission(false)}
              style={{
                padding: '6px 16px', background: 'transparent', color: s.red, border: `1px solid ${s.red}`,
                borderRadius: 5, cursor: 'pointer', fontFamily: s.mono, fontSize: 12, fontWeight: 600,
              }}
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {metrics && (
        <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.green}`, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.green, marginBottom: 12, fontFamily: s.mono }}>Usage Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key} style={{ padding: '8px 10px', background: s.bg, borderRadius: 5, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{key}</div>
                <div style={{ fontSize: 14, fontFamily: s.mono, fontWeight: 600, color: s.text }}>{val}</div>
              </div>
            ))}
          </div>
          {permissionDecision === 'approved' && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: `${s.green}10`, borderRadius: 5, border: `1px solid ${s.green}30` }}>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.green }}>1 file written: src/middleware/auth.ts</span>
            </div>
          )}
          {permissionDecision === 'denied' && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: `${s.orange}10`, borderRadius: 5, border: `1px solid ${s.orange}30` }}>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.orange }}>0 files written — all writes denied by host</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
      `}</style>
    </div>
  )
}

export default function AgentSdkDemo() {
  return (
    <DemoBoundary name="Agent SDK">
      <AgentSdkDemoInner />
    </DemoBoundary>
  )
}

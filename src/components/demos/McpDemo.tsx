import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface McpServer {
  name: string
  transport: 'stdio' | 'sse' | 'http' | 'ws'
  status: 'connected' | 'connecting' | 'error' | 'disabled'
  tools: McpTool[]
  icon: string
}

interface McpTool {
  name: string
  description: string
}

interface McpServers {
  [key: string]: McpServer
}

const initialServers: McpServers = {
  github: {
    name: 'github',
    transport: 'stdio',
    status: 'connected',
    tools: [
      { name: 'create_issue', description: 'Create a GitHub issue' },
      { name: 'list_prs', description: 'List pull requests' },
      { name: 'search_code', description: 'Search code in repos' },
    ],
    icon: 'GH',
  },
  slack: {
    name: 'slack',
    transport: 'sse',
    status: 'connected',
    tools: [
      { name: 'send_message', description: 'Send a Slack message' },
      { name: 'get_channel_history', description: 'Get channel messages' },
    ],
    icon: 'SL',
  },
  database: {
    name: 'postgres-prod',
    transport: 'http',
    status: 'error',
    tools: [
      { name: 'query', description: 'Execute SQL query' },
      { name: 'list_tables', description: 'List database tables' },
    ],
    icon: 'PG',
  },
  figma: {
    name: 'figma',
    transport: 'ws',
    status: 'connected',
    tools: [
      { name: 'get_file', description: 'Get Figma file data' },
      { name: 'get_components', description: 'List components' },
    ],
    icon: 'FG',
  },
}

const transportColors: Record<string, string> = {
  stdio: s.green,
  sse: s.accent,
  http: s.purple,
  ws: s.orange,
}

const statusColors: Record<string, string> = {
  connected: s.green,
  connecting: s.yellow,
  error: s.red,
  disabled: s.text3,
}

export default function McpDemo() {
  const [servers, setServers] = useState<McpServers>(initialServers)
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [toolCallResult, setToolCallResult] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)

  const server = selected ? servers[selected] : null
  const tool = selectedTool && server
    ? server.tools.find((t) => t.name === selectedTool)
    : null

  const toggleServer = useCallback((name: string) => {
    setServers((prev) => {
      const srv = prev[name]
      if (srv.status === 'connected') {
        return { ...prev, [name]: { ...srv, status: 'disabled' as const } }
      }
      if (srv.status === 'disabled') {
        return { ...prev, [name]: { ...srv, status: 'connected' as const } }
      }
      return prev
    })
    if (selected === name) {
      setSelected(null)
      setSelectedTool(null)
      setToolCallResult(null)
    }
  }, [selected])

  const callTool = useCallback(() => {
    if (!tool || !server) return
    setCalling(true)
    setToolCallResult(null)
    setTimeout(() => {
      const fullName = `mcp__${server.name}__${tool.name}`
      const fakeResult = JSON.stringify({
        status: 'success',
        data: {
          message: `Called ${fullName}`,
          timestamp: new Date().toISOString(),
        },
      }, null, 2)
      setToolCallResult(fakeResult)
      setCalling(false)
    }, 800)
  }, [tool, server])

  const totalTools = Object.values(servers)
    .filter((srv) => srv.status === 'connected')
    .reduce((sum, srv) => sum + srv.tools.length, 0)

  return (
    <DemoBoundary name="MCP Server Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 11,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                MCP Servers
              </div>
              {Object.entries(servers).map(([key, srv]) => (
                <div
                  key={key}
                  onClick={() => {
                    if (srv.status !== 'disabled') {
                      setSelected(key)
                      setSelectedTool(null)
                      setToolCallResult(null)
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: srv.status === 'disabled' ? 'default' : 'pointer',
                    borderBottom: `1px solid ${s.border}`,
                    background: selected === key ? `${s.accent}10` : 'transparent',
                    opacity: srv.status === 'disabled' ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      background: `${transportColors[srv.transport]}20`,
                      border: `1px solid ${transportColors[srv.transport]}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: s.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      color: transportColors[srv.transport],
                      flexShrink: 0,
                    }}>
                      {srv.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: s.mono,
                        fontSize: 11,
                        fontWeight: 600,
                        color: selected === key ? s.text : s.text2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {srv.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{
                          fontFamily: s.mono,
                          fontSize: 9,
                          color: transportColors[srv.transport],
                        }}>
                          {srv.transport.toUpperCase()}
                        </span>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: statusColors[srv.status],
                          flexShrink: 0,
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{
                padding: '8px 12px',
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                borderTop: `1px solid ${s.border}`,
              }}>
                {totalTools} tools from {Object.values(servers).filter((srv) => srv.status === 'connected').length} servers
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Transports
                </div>
                {[
                  ['stdio', 'Child process (stdin/stdout)'],
                  ['sse', 'Server-Sent Events (HTTP)'],
                  ['http', 'Streamable HTTP'],
                  ['ws', 'WebSocket'],
                ].map(([t, desc]) => (
                  <div key={t} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: s.mono, fontSize: 10 }}>
                    <span style={{ color: transportColors[t], flexShrink: 0, width: 36 }}>{t}</span>
                    <span style={{ color: s.text3 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {!server ? (
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '40px 20px',
                textAlign: 'center',
                color: s.text3,
                fontSize: 13,
              }}>
                Select an MCP server to explore its tools
              </div>
            ) : (
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: s.mono, fontSize: 13, fontWeight: 600, color: s.text }}>
                      mcp__{server.name}
                    </span>
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 10,
                      color: transportColors[server.transport],
                      background: `${transportColors[server.transport]}18`,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {server.transport}
                    </span>
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 10,
                      color: statusColors[server.status],
                    }}>
                      {server.status}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleServer(server.name)}
                    style={{
                      padding: '4px 10px',
                      background: server.status === 'connected' ? `${s.red}18` : `${s.green}18`,
                      border: `1px solid ${server.status === 'connected' ? s.red : s.green}`,
                      borderRadius: 4,
                      color: server.status === 'connected' ? s.red : s.green,
                      fontFamily: s.mono,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    {server.status === 'connected' ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tools ({server.tools.length})
                  </div>
                  {server.tools.map((t) => (
                    <div
                      key={t.name}
                      onClick={() => {
                        setSelectedTool(t.name)
                        setToolCallResult(null)
                      }}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 6,
                        background: selectedTool === t.name ? `${s.accent}10` : s.bg2,
                        border: `1px solid ${selectedTool === t.name ? s.accent + '50' : s.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: s.mono, fontSize: 12, fontWeight: 600, color: s.text }}>
                          mcp__{server.name}__{t.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: s.text3 }}>{t.description}</div>
                    </div>
                  ))}

                  {tool && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={callTool}
                        disabled={calling}
                        style={{
                          padding: '7px 20px',
                          background: calling ? s.bg3 : s.accent,
                          color: calling ? s.text3 : '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: calling ? 'not-allowed' : 'pointer',
                          fontFamily: s.mono,
                          transition: 'all 0.2s',
                        }}
                      >
                        {calling ? 'Calling...' : `Call ${tool.name}`}
                      </button>

                      {toolCallResult && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            tool_result
                          </div>
                          <pre style={{
                            fontFamily: s.mono,
                            fontSize: 11,
                            color: s.green,
                            background: s.bg2,
                            padding: 10,
                            borderRadius: 6,
                            border: `1px solid ${s.border}`,
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                            lineHeight: 1.5,
                          }}>
                            {toolCallResult}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

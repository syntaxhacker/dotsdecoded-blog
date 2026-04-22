import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Tab = 'endpoints' | 'errors' | 'patterns' | 'auth'

interface Endpoint {
  method: string
  path: string
  description: string
  request?: string
  response: string
  status: number
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/shorten',
    description: 'Create a short URL from a long one',
    status: 201,
    request: JSON.stringify({
      url: 'https://docs.google.com/spreadsheets/d/1aBcDeF/edit',
      custom_alias: 'my-sheet',
    }, null, 2),
    response: JSON.stringify({
      short_code: 'aB3x9Q',
      short_url: 'https://short.est/aB3x9Q',
      original_url: 'https://docs.google.com/spreadsheets/d/1aBcDeF/edit',
      created_at: '2026-04-22T10:30:00Z',
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/{shortCode}',
    description: 'Redirect to the original long URL',
    status: 302,
    response: 'HTTP/1.1 302 Found\nLocation: https://docs.google.com/spreadsheets/d/1aBcDeF/edit\nCache-Control: no-store',
  },
  {
    method: 'DELETE',
    path: '/api/links/{shortCode}',
    description: 'Delete a short link permanently',
    status: 200,
    response: JSON.stringify({
      deleted: true,
      short_code: 'aB3x9Q',
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/links/{shortCode}/stats',
    description: 'Get click analytics for a short link',
    status: 200,
    response: JSON.stringify({
      short_code: 'aB3x9Q',
      clicks: 1234,
      unique_visitors: 892,
      countries: [
        { code: 'US', name: 'United States', clicks: 567 },
        { code: 'GB', name: 'United Kingdom', clicks: 203 },
        { code: 'DE', name: 'Germany', clicks: 148 },
      ],
      browsers: [
        { name: 'Chrome', clicks: 723 },
        { name: 'Safari', clicks: 312 },
        { name: 'Firefox', clicks: 199 },
      ],
      referrers: [
        { source: 'twitter.com', clicks: 445 },
        { source: 'direct', clicks: 389 },
        { source: 'google.com', clicks: 200 },
      ],
    }, null, 2),
  },
]

const errorResponses = [
  {
    code: 400,
    title: 'Bad Request',
    description: 'Invalid URL format or missing required field',
    example: JSON.stringify({
      error: 'invalid_url',
      message: 'The provided URL is not a valid HTTP/HTTPS URL.',
    }, null, 2),
  },
  {
    code: 404,
    title: 'Not Found',
    description: 'Short code does not exist in the database',
    example: JSON.stringify({
      error: 'not_found',
      message: 'No link found for short code "xYz123".',
    }, null, 2),
  },
  {
    code: 429,
    title: 'Too Many Requests',
    description: 'Rate limit exceeded — slow down or add API key',
    example: JSON.stringify({
      error: 'rate_limited',
      message: 'Rate limit exceeded. Try again in 60 seconds.',
      retry_after: 60,
    }, null, 2),
  },
]

const restPatterns = [
  { pattern: 'Nouns, not verbs', example: '/api/links/{id}  instead of  /api/getLink', note: 'The HTTP method already describes the action' },
  { pattern: 'Resource hierarchy', example: '/api/links/{id}/stats  (stats belong to a link)', note: 'Nested paths express parent-child relationships' },
  { pattern: 'Standard methods', example: 'GET = read, POST = create, DELETE = remove', note: 'Do not invent new methods like /api/removeLink' },
  { pattern: 'Consistent responses', example: '{ deleted: true }  instead of  { success: "The link was removed" }', note: 'Structured data, not human-readable messages' },
  { pattern: 'Status codes match reality', example: '201 for created, 302 for redirect, 404 for missing', note: 'Never return 200 for an error' },
  { pattern: 'Pagination for lists', example: '/api/links?page=2&limit=50', note: 'Always paginate — never return unbounded arrays' },
]

export default function UrlApiDesignDemo() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number | null>(0)
  const [selectedError, setSelectedError] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<Tab>('endpoints')

  const currentEndpoint = selectedEndpoint !== null ? endpoints[selectedEndpoint] : null

  const methodColor = (method: string) => {
    switch (method) {
      case 'GET': return s.green
      case 'POST': return s.accent
      case 'DELETE': return s.red
      default: return s.text2
    }
  }

  const statusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return s.green
    if (code >= 300 && code < 400) return s.accent
    if (code >= 400 && code < 500) return s.yellow
    return s.red
  }

  const tabStyle = (tab: Tab) => ({
    padding: '8px 14px',
    fontSize: 12,
    fontFamily: s.mono,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: activeTab === tab ? s.bg3 : 'transparent',
    color: activeTab === tab ? s.text : s.text3,
    transition: 'all 0.15s',
  })

  return (
    <DemoBoundary name="URL Shortener API Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>

          <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: `1px solid ${s.border}`, background: s.bg }}>
            {(['endpoints', 'errors', 'patterns', 'auth'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
                {tab === 'endpoints' && 'Endpoints'}
                {tab === 'errors' && 'Error Responses'}
                {tab === 'patterns' && 'REST Patterns'}
                {tab === 'auth' && 'Authentication'}
              </button>
            ))}
          </div>

          {activeTab === 'endpoints' && (
            <div>
              <div style={{ display: 'flex', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ width: '55%', padding: 0 }}>
                  {endpoints.map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpoint(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: idx < endpoints.length - 1 ? `1px solid ${s.border}` : 'none',
                        borderRight: selectedEndpoint === idx ? `2px solid ${s.accent}` : '2px solid transparent',
                        background: selectedEndpoint === idx ? s.bg : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{
                        fontSize: 10,
                        fontFamily: s.mono,
                        fontWeight: 700,
                        color: methodColor(ep.method),
                        minWidth: 52,
                        padding: '3px 6px',
                        borderRadius: 4,
                        background: selectedEndpoint === idx ? s.bg3 : s.bg,
                        textAlign: 'center',
                      }}>
                        {ep.method}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontFamily: s.mono,
                          color: selectedEndpoint === idx ? s.text : s.text2,
                          fontWeight: selectedEndpoint === idx ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {ep.path}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: s.text3,
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {ep.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, padding: 16, minHeight: 300 }}>
                  {currentEndpoint && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{
                          fontSize: 11,
                          fontFamily: s.mono,
                          fontWeight: 700,
                          color: methodColor(currentEndpoint.method),
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: s.bg3,
                        }}>
                          {currentEndpoint.method}
                        </span>
                        <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text }}>{currentEndpoint.path}</span>
                        <span style={{
                          fontSize: 10,
                          fontFamily: s.mono,
                          color: statusCodeColor(currentEndpoint.status),
                          marginLeft: 'auto',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: s.bg3,
                        }}>
                          {currentEndpoint.status}
                        </span>
                      </div>

                      {currentEndpoint.request && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Request Body</div>
                          <div style={{
                            background: s.bg,
                            borderRadius: 6,
                            border: `1px solid ${s.border}`,
                            padding: '10px 12px',
                            fontSize: 12,
                            fontFamily: s.mono,
                            color: s.text2,
                            whiteSpace: 'pre' as const,
                            overflowX: 'auto',
                          }}>
                            {currentEndpoint.request}
                          </div>
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Response</div>
                        <div style={{
                          background: s.bg,
                          borderRadius: 6,
                          border: `1px solid ${s.border}`,
                          padding: '10px 12px',
                          fontSize: 12,
                          fontFamily: s.mono,
                          color: currentEndpoint.status >= 400 ? s.red : s.green,
                          whiteSpace: 'pre' as const,
                          overflowX: 'auto',
                        }}>
                          {currentEndpoint.response}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                HTTP Error Responses
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {errorResponses.map((err, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedError(idx)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontFamily: s.mono,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: `1px solid ${selectedError === idx ? statusCodeColor(err.code) : s.border}`,
                      background: selectedError === idx ? s.bg3 : s.bg,
                      color: selectedError === idx ? statusCodeColor(err.code) : s.text3,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {err.code}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontFamily: s.mono, fontWeight: 600, color: statusCodeColor(errorResponses[selectedError].code), marginBottom: 4 }}>
                  {errorResponses[selectedError].code} {errorResponses[selectedError].title}
                </div>
                <div style={{ fontSize: 12, color: s.text2 }}>{errorResponses[selectedError].description}</div>
              </div>

              <div style={{
                background: s.bg,
                borderRadius: 6,
                border: `1px solid ${s.border}`,
                padding: '10px 12px',
                fontSize: 12,
                fontFamily: s.mono,
                color: s.yellow,
                whiteSpace: 'pre' as const,
                overflowX: 'auto',
              }}>
                {errorResponses[selectedError].example}
              </div>

              <div style={{ marginTop: 16, padding: '10px 14px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>All Error Codes</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {errorResponses.map(err => (
                    <div key={err.code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 12,
                        fontFamily: s.mono,
                        fontWeight: 700,
                        color: statusCodeColor(err.code),
                        background: s.bg3,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        {err.code}
                      </span>
                      <span style={{ fontSize: 11, color: s.text2 }}>{err.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                RESTful Design Patterns
              </div>
              {restPatterns.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: idx < restPatterns.length - 1 ? 12 : 0,
                    padding: '10px 14px',
                    background: s.bg,
                    borderRadius: 8,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontFamily: s.mono, color: s.green, fontWeight: 600, marginBottom: 6 }}>
                    {p.pattern}
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontFamily: s.mono,
                    color: s.accent,
                    background: s.bg3,
                    padding: '6px 10px',
                    borderRadius: 4,
                    marginBottom: 6,
                    whiteSpace: 'pre' as const,
                    overflowX: 'auto',
                  }}>
                    {p.example}
                  </div>
                  <div style={{ fontSize: 11, color: s.text3 }}>{p.note}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'auth' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                API Key Authentication
              </div>

              <div style={{
                background: s.bg,
                borderRadius: 8,
                border: `1px solid ${s.border}`,
                padding: '12px 14px',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>Public endpoint — no auth needed</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: s.mono, fontWeight: 700, color: s.green, padding: '2px 6px', borderRadius: 4, background: s.bg3 }}>GET</span>
                  <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text2 }}>/{'{'}shortCode{'}'}</span>
                  <span style={{ fontSize: 11, color: s.text3, marginLeft: 'auto' }}>redirect — open to anyone</span>
                </div>
              </div>

              <div style={{
                background: s.bg,
                borderRadius: 8,
                border: `1px solid ${s.border}`,
                padding: '12px 14px',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>Protected endpoint — API key required</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: s.mono, fontWeight: 700, color: s.accent, padding: '2px 6px', borderRadius: 4, background: s.bg3 }}>POST</span>
                  <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text2 }}>/api/shorten</span>
                  <span style={{ fontSize: 10, fontFamily: s.mono, color: s.orange, padding: '2px 6px', borderRadius: 4, background: s.bg3, marginLeft: 'auto' }}>AUTH</span>
                </div>
              </div>

              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Request with API Key</div>
              <div style={{
                background: s.bg,
                borderRadius: 6,
                border: `1px solid ${s.border}`,
                padding: '10px 12px',
                fontSize: 12,
                fontFamily: s.mono,
                color: s.text2,
                whiteSpace: 'pre' as const,
                overflowX: 'auto',
                marginBottom: 14,
              }}>
{`POST /api/shorten HTTP/1.1
Host: short.est
Authorization: Bearer sk_live_aB3x9Q...
Content-Type: application/json

{
  "url": "https://example.com/very/long/path"
}`}
              </div>

              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Without API Key (or invalid)</div>
              <div style={{
                background: s.bg,
                borderRadius: 6,
                border: `1px solid ${s.border}`,
                padding: '10px 12px',
                fontSize: 12,
                fontFamily: s.mono,
                color: s.red,
                whiteSpace: 'pre' as const,
                overflowX: 'auto',
              }}>
{`HTTP/1.1 401 Unauthorized

{
  "error": "unauthorized",
  "message": "Valid API key required. Include Authorization header."
}`}
              </div>

              <div style={{ marginTop: 16, padding: '10px 14px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Why API keys instead of OAuth?</div>
                <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>
                  A URL shortener serves developers, not end users. API keys are simpler to implement, easier to rate-limit per-key, and sufficient for server-to-server calls. OAuth adds complexity (redirect flows, token refresh) with no benefit since there is no user login.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DemoBoundary>
  )
}

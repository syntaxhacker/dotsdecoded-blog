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

interface Req {
  id: string
  title: string
  icon: string
  color: string
  summary: string
  detail: string
  howItWorks: string
}

const requirements: Req[] = [
  {
    id: 'routing',
    title: 'Request Routing',
    icon: '\u2192',
    color: s.accent,
    summary: 'Maps incoming requests to the correct backend service based on path, host, headers, or method.',
    detail: 'The gateway inspects the URL path (/api/users -> Users Service), the Host header (api.example.com -> Gateway), or custom headers (X-Version: v2 -> v2 stack). Routes can match exact paths, wildcards, or regex patterns. Supports prefix stripping and path rewriting before forwarding.',
    howItWorks: 'Route table maps patterns to upstream targets. First match wins. Rules evaluated in order: exact > prefix > regex.',
  },
  {
    id: 'auth',
    title: 'Authentication',
    icon: '\u26e8',
    color: s.green,
    summary: 'Validates JWT tokens, API keys, or OAuth credentials before forwarding requests.',
    detail: 'The gateway intercepts every request and checks credentials before any other processing. JWT validation: verify signature, check expiry, extract claims. API key lookup: check key against store, verify rate tier. OAuth: redirect or validate bearer tokens. Failed auth returns 401/403 immediately without reaching upstream.',
    howItWorks: 'Credentials extracted from Authorization header, cookie, or query param. Validated against configured provider. User info injected as downstream headers (X-User-Id, X-User-Role).',
  },
  {
    id: 'rate-limit',
    title: 'Rate Limiting',
    icon: '\u25b6',
    color: s.yellow,
    summary: 'Prevents any single client from overwhelming the system by capping request frequency.',
    detail: 'Rate limits apply per API key, per IP, per endpoint, or globally. Common algorithms: token bucket (burst-friendly), sliding window (smooth), fixed window (simple). Distributed rate limiting uses Redis for shared counters. Exceeded limits return 429 with Retry-After header and rate limit headers (X-RateLimit-Remaining).',
    howItWorks: 'Each client key gets a counter in Redis (or local memory). Counter checked on every request, incremented if allowed, rejected if over limit. Expiry resets the window.',
  },
  {
    id: 'transform',
    title: 'Request/Response Transform',
    icon: '\u2194',
    color: s.purple,
    summary: 'Modifies requests before forwarding and responses before returning to the client.',
    detail: 'Outbound: add/remove headers (X-Request-Id, X-Forwarded-For), rewrite paths, convert request body format (XML to JSON), inject upstream credentials. Inbound: strip internal headers, merge responses from multiple services, convert protocols (gRPC to REST). Template engines allow dynamic header values from request data.',
    howItWorks: 'Outbound transform runs after routing, before upstream call. Inbound transform runs after upstream response, before client response. Both use configurable rules (add, set, remove, rename, template).',
  },
  {
    id: 'logging',
    title: 'Logging & Monitoring',
    icon: '\u25c8',
    color: s.orange,
    summary: 'Records every request for debugging, analytics, and observability dashboards.',
    detail: 'Every request generates a log entry: method, path, status code, response time, client IP, user agent, request ID. Metrics include request rate, error rate, p50/p95/p99 latency per route, per upstream. Logs feed into ELK, Datadog, or Grafana. Alerts trigger on error spikes or latency degradation.',
    howItWorks: 'Log plugin captures request metadata at start and response metadata at end. Computes duration. Emits structured log (JSON) and increments counters. Asynchronous -- never blocks the request path.',
  },
  {
    id: 'circuit-breaker',
    title: 'Circuit Breaking',
    icon: '\u2609',
    color: s.red,
    summary: 'Detects failing upstream services and stops sending traffic to them before they collapse.',
    detail: 'Monitors upstream health through error rates and response latencies. When error rate exceeds a threshold (e.g., 50% of requests fail) within a window (e.g., 10 seconds), the circuit opens. Open circuit rejects requests immediately without calling upstream. After a cooldown period (e.g., 30s), half-open state allows a probe request. If it succeeds, circuit closes. If it fails, back to open.',
    howItWorks: 'Three states: closed (normal), open (rejecting), half-open (testing). Counters track successes/failures per sliding window. Thresholds configurable per upstream.',
  },
  {
    id: 'cors',
    title: 'CORS Handling',
    icon: '\u2295',
    color: s.text2,
    summary: 'Manages cross-origin requests so browsers can call the API from different domains.',
    detail: 'CORS (Cross-Origin Resource Sharing) is enforced by browsers. Without the gateway handling it, every service would need its own CORS config. The gateway processes OPTIONS preflight requests and adds appropriate headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Max-Age. Configurable per route or globally.',
    howItWorks: 'On OPTIONS request: respond immediately with CORS headers. On regular request: add CORS headers to response. Origin check against whitelist. Credentials flag for cookies/auth headers.',
  },
  {
    id: 'caching',
    title: 'Caching',
    icon: '\u25a2',
    color: s.green,
    summary: 'Stores frequent responses so identical requests never reach the upstream service.',
    detail: 'Gateway caching is a reverse-proxy cache (like Varnish or Kong proxy-cache). Cache keys are built from method, path, query params, and headers. Responses are stored with a TTL. Subsequent identical requests served from cache instantly (sub-millisecond vs 50-500ms upstream). Cache invalidation: TTL expiry, manual purge via admin API, or cache-control headers from upstream.',
    howItWorks: 'On first request: forward to upstream, store response in cache (memory or Redis). On subsequent request: lookup cache key, if fresh return directly. Cache-control headers from upstream control TTL. Cache size bounded with LRU eviction.',
  },
]

export default function GatewayRequirementsDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const sel = requirements.find(r => r.id === selected)

  return (
    <DemoBoundary name="Gateway Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={H}>What an API Gateway Does</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click any requirement to see details about how the gateway handles it. Every production gateway implements most of these.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {requirements.map(req => (
            <button key={req.id} onClick={() => setSelected(selected === req.id ? null : req.id)} style={{
              background: selected === req.id ? `${req.color}15` : s.bg3,
              border: `1px solid ${selected === req.id ? req.color : s.border}`,
              borderRadius: 10, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 6,
              outline: 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${req.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: req.color, flexShrink: 0,
              }}>
                {req.icon}
              </div>
              <div>
                <div style={{ color: selected === req.id ? req.color : s.text, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  {req.title}
                </div>
                <div style={{ color: s.text3, fontSize: 10, lineHeight: 1.4 }}>
                  {req.summary}
                </div>
              </div>
            </button>
          ))}
        </div>

        {sel ? (
          <div style={{
            background: s.bg, border: `1px solid ${sel.color}40`, borderRadius: 10, padding: 20,
            animation: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${sel.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: sel.color, flexShrink: 0,
              }}>
                {sel.icon}
              </div>
              <div>
                <div style={{ color: sel.color, fontSize: 16, fontWeight: 700 }}>{sel.title}</div>
                <div style={{ color: s.text3, fontSize: 11 }}>Click again to close</div>
              </div>
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              {sel.detail}
            </div>
            <div style={{
              background: s.bg3, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${sel.color}`,
            }}>
              <div style={{ color: sel.color, fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                How it works
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6, fontFamily: s.mono }}>
                {sel.howItWorks}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            Click any requirement to see implementation details
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}

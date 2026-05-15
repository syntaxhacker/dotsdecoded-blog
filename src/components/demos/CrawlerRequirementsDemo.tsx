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

interface Req {
  key: string; title: string; desc: string; detail: string; status: 'done' | 'partial' | 'critical'
}

const reqs: Req[] = [
  { key: 'scale', title: 'Scale', desc: 'Crawl 10B+ pages efficiently',
    detail: 'Distributed crawler fleet across multiple datacenters. Each crawler processes millions of pages per day. URL frontier partitions URLs by domain and priority to balance load across workers. Estimated throughput: 10B pages / 30 days = 333M pages/day = 3,858 pages/second at peak.',
    status: 'critical' },
  { key: 'freshness', title: 'Freshness', desc: 'Re-crawl frequency based on change rate',
    detail: 'Hot pages (news, social feeds) re-crawled every few minutes. Cold pages (static docs) re-crawled weekly. Change rate estimated from HTTP Last-Modified headers, ETags, and content hash diffing. Priority queue promotes recently-changed pages for faster re-crawl.',
    status: 'partial' },
  { key: 'politeness', title: 'Politeness', desc: 'Respect robots.txt, rate limits, crawl delay',
    detail: 'Parse and cache robots.txt per domain. Enforce minimum Crawl-Delay directive. Add random jitter to avoid thundering herd. Per-domain rate limiter via token bucket. DNS lookups cached with TTL to reduce load on authoritative nameservers.',
    status: 'done' },
  { key: 'storage', title: 'Storage', desc: 'Raw pages + metadata at petabyte scale',
    detail: 'Compressed page storage in columnar format (Parquet). Metadata in KV store (RocksDB): URL as key, (fetch_time, http_status, content_hash, content_type, size) as value. Estimated: 10B pages x 50 KB avg = 500 TB compressed, plus 10B x 256 bytes metadata = 2.5 TB.',
    status: 'partial' },
  { key: 'dedup', title: 'Deduplication', desc: 'Detect exact and near-duplicate content',
    detail: 'URL canonicalization before queueing (remove fragments, normalize scheme, sort query params). Content hash (SHA-256) for exact dedup. SimHash for near-duplicate detection with hamming distance threshold. Eliminates ~30% redundant crawl volume.',
    status: 'done' },
]

function CrawlerRequirementsInner() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const done = reqs.filter(r => r.status === 'done').length
  const partial = reqs.filter(r => r.status === 'partial').length
  const total = reqs.length
  const score = (done * 1 + partial * 0.5) / total

  const badge = (st: Req['status']) => {
    const map: Record<string, { icon: string; color: string }> = {
      done: { icon: '\u2713', color: s.green },
      partial: { icon: '\u25D0', color: s.yellow },
      critical: { icon: '!', color: s.red },
    }
    return map[st]
  }

  const statusLabel = { done: 'Addressed', partial: 'Partial', critical: 'Critical' }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '16px 0' }}>
      <div style={SEC}>
        <div style={H}>Requirements Checklist</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A production web crawler must satisfy five critical requirements. Click each card to expand.
        </p>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Readiness: {done} met, {partial} partial, {total - done - partial} critical</span>
            <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>{Math.round(score * 100)}%</span>
          </div>
          <div style={{ background: s.bg3, borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${s.green}, ${s.accent})`, width: `${score * 100}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reqs.map(req => {
            const isOpen = expanded === req.key
            const bdg = badge(req.status)
            return (
              <div key={req.key} style={{
                background: s.bg, border: `1px solid ${isOpen ? bdg.color : s.border}`,
                borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.2s',
              }} onClick={() => setExpanded(isOpen ? null : req.key)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `${bdg.color}22`, border: `2px solid ${bdg.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: bdg.color, fontSize: 13, fontWeight: 700 }}>{bdg.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{req.title}</span>
                      <span style={{
                        fontSize: 10, color: bdg.color, fontFamily: s.mono, background: `${bdg.color}15`,
                        padding: '1px 8px', borderRadius: 4,
                      }}>{statusLabel[req.status]}</span>
                    </div>
                    <div style={{ color: s.text3, fontSize: 12, marginTop: 2 }}>{req.desc}</div>
                  </div>
                  <span style={{ color: s.text3, fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>{'\u25BE'}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${s.border}`, padding: '14px 16px', color: s.text2, fontSize: 13, lineHeight: 1.7, cursor: 'default' }}>
                    {req.detail}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function CrawlerRequirementsDemo() {
  return (
    <DemoBoundary name="Crawler Requirements Checklist">
      <CrawlerRequirementsInner />
    </DemoBoundary>
  )
}

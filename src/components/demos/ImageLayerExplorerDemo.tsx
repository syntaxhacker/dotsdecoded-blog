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

interface Layer {
  hash: string
  cmd: string
  size: string
  sizeBytes: number
  files: string[]
}

interface ImageData {
  name: string
  totalBytes: number
  totalSize: string
  layers: Layer[]
}

const images: Record<string, ImageData> = {
  ubuntu: {
    name: 'ubuntu:latest',
    totalBytes: 78000,
    totalSize: '78.0 MB',
    layers: [
      { hash: 'sha256:b2b7...', cmd: 'RUN apt-get update', size: '30.2 MB', sizeBytes: 30200, files: ['/var/lib/apt/lists/', '/var/lib/dpkg/'] },
      { hash: 'sha256:c3c9...', cmd: 'RUN apt-get install -y coreutils', size: '20.5 MB', sizeBytes: 20500, files: ['/usr/bin/cat', '/usr/bin/ls', '/usr/bin/sort', '/usr/share/man/'] },
      { hash: 'sha256:d4d8...', cmd: 'RUN apt-get install -y curl', size: '15.3 MB', sizeBytes: 15300, files: ['/usr/bin/curl', '/usr/lib/x86_64-linux-gnu/libcurl.so'] },
      { hash: 'sha256:e5e7...', cmd: 'RUN rm -rf /var/lib/apt/lists/*', size: '12.0 MB', sizeBytes: 12000, files: ['/var/lib/apt/lists/ [deleted]'] },
    ],
  },
  python: {
    name: 'python:3.11-slim',
    totalBytes: 143000,
    totalSize: '143 MB',
    layers: [
      { hash: 'sha256:f1f2...', cmd: 'FROM debian:bookworm-slim', size: '80.0 MB', sizeBytes: 80000, files: ['/bin/', '/lib/x86_64-linux-gnu/', '/etc/ld.so.cache', '/usr/lib/'] },
      { hash: 'sha256:g2g3...', cmd: 'RUN apt-get update', size: '25.3 MB', sizeBytes: 25300, files: ['/var/lib/dpkg/info/', '/var/lib/apt/lists/'] },
      { hash: 'sha256:h3h4...', cmd: 'RUN apt-get install -y python3.11-minimal', size: '30.5 MB', sizeBytes: 30500, files: ['/usr/bin/python3.11', '/usr/lib/python3.11/', '/usr/lib/python3'] },
      { hash: 'sha256:i4i5...', cmd: 'RUN apt-get install -y python3-pip', size: '5.2 MB', sizeBytes: 5200, files: ['/usr/bin/pip3', '/usr/lib/python3/dist-packages/pip/'] },
      { hash: 'sha256:j5j6...', cmd: 'RUN rm -rf /root/.cache /var/cache', size: '2.0 MB', sizeBytes: 2000, files: ['/root/.cache/ [deleted]', '/var/cache/apt/ [deleted]'] },
    ],
  },
  alpine: {
    name: 'alpine:latest',
    totalBytes: 7050,
    totalSize: '7.05 MB',
    layers: [
      { hash: 'sha256:a1a2...', cmd: 'ADD rootfs.tar.gz /', size: '7.05 MB', sizeBytes: 7050, files: ['/bin/busybox', '/etc/apk/', '/lib/ld-musl-x86_64.so.1', '/usr/share/udhcpc/'] },
    ],
  },
  distroless: {
    name: 'gcr.io/distroless/python3',
    totalBytes: 52000,
    totalSize: '52.0 MB',
    layers: [
      { hash: 'sha256:k6k7...', cmd: 'FROM debian:bookworm-slim', size: '30.0 MB', sizeBytes: 30000, files: ['/lib/', '/usr/lib/x86_64-linux-gnu/', '/etc/'] },
      { hash: 'sha256:l7l8...', cmd: 'ADD python3-static.tar.gz /', size: '18.5 MB', sizeBytes: 18500, files: ['/usr/bin/python3', '/usr/lib/python3.11/', '/usr/local/lib/'] },
      { hash: 'sha256:m8m9...', cmd: 'RUN rm -rf /usr/share/doc /var/cache', size: '3.5 MB', sizeBytes: 3500, files: ['/usr/share/doc/ [deleted]', '/var/cache/ [deleted]'] },
    ],
  },
}

const imageKeys = ['ubuntu', 'python', 'alpine', 'distroless']

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

function getLayerColor(idx: number, total: number): string {
  const t = total > 1 ? idx / (total - 1) : 0
  const r = Math.round(20 + t * 40)
  const g = Math.round(40 + t * 80)
  const b = Math.round(100 + t * 100)
  return 'rgb(' + r + ',' + g + ',' + b + ')'
}

export default function ImageLayerExplorerDemo() {
  const [activeKey, setActiveKey] = useState('python')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const img = images[activeKey]
  const maxSize = Math.max(...img.layers.map((l) => l.sizeBytes))

  return (
    <DemoBoundary name="Image Layer Explorer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Image Layer Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Docker images are stacks of read-only layers. Each layer records the changes from one Dockerfile instruction.
          Layers are shared and cached across images.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {imageKeys.map((key) => {
            const data = images[key]
            const active = key === activeKey
            return (
              <button key={key} onClick={() => { setActiveKey(key); setExpandedIdx(null) }} style={{
                flex: 1, padding: '8px 6px', borderRadius: 8, border: active ? '1px solid ' + s.accent : '1px solid ' + s.border,
                background: active ? s.accent + '12' : s.bg, color: active ? s.text : s.text2,
                cursor: 'pointer', fontSize: 11, textAlign: 'center', transition: 'all 0.2s',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.name}</div>
                <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>
                  {data.totalSize} / {data.layers.length} layer{data.layers.length > 1 ? 's' : ''}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Layer Stack
              <span style={{ color: s.text2, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                {img.layers.length} total
              </span>
            </div>
            <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 8, overflow: 'hidden' }}>
              {img.layers.map((layer, i) => {
                const color = getLayerColor(i, img.layers.length)
                const pct = layer.sizeBytes / maxSize * 100
                const expanded = expandedIdx === i
                return (
                  <div key={i}>
                    <div
                      onClick={() => setExpandedIdx(expanded ? null : i)}
                      style={{
                        padding: '10px 12px', cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: i < img.layers.length - 1 ? '1px solid ' + s.border : 'none',
                        background: expanded ? color + '30' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6, background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: s.mono, flexShrink: 0,
                        }}>
                          L{i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: s.text, fontSize: 12, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {layer.cmd}
                          </div>
                          <div style={{ display: 'flex', gap: 10, color: s.text3, fontSize: 10, fontFamily: s.mono }}>
                            <span>{layer.size}</span>
                            <span>{layer.hash}</span>
                          </div>
                        </div>
                        <div style={{
                          width: 60, height: 8, borderRadius: 4, background: s.bg3, overflow: 'hidden', flexShrink: 0,
                        }}>
                          <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono, minWidth: 32, textAlign: 'right' }}>
                          {expanded ? '\u25B2' : '\u25BC'}
                        </div>
                      </div>
                    </div>
                    {expanded && (
                      <div style={{
                        background: s.bg2, padding: '10px 12px 10px 54px',
                        borderBottom: '1px solid ' + s.border,
                      }}>
                        <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Files in this layer
                        </div>
                        {layer.files.map((f, fi) => (
                          <div key={fi} style={{
                            color: f.includes('[deleted]') ? s.red + '80' : s.text2,
                            fontFamily: s.mono, fontSize: 11, padding: '2px 0',
                          }}>
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ width: 180, flexShrink: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Layer Sizes
            </div>
            <div style={{
              background: s.bg, border: '1px solid ' + s.border, borderRadius: 8,
              padding: 12, display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {img.layers.map((layer, i) => {
                const color = getLayerColor(i, img.layers.length)
                const pct = layer.sizeBytes / maxSize * 100
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>L{i + 1}</span>
                      <span style={{ color: s.text2, fontSize: 10, fontFamily: s.mono }}>{layer.size}</span>
                    </div>
                    <div style={{ height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{
                marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + s.border,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: s.text3, fontSize: 11 }}>Total</span>
                <span style={{ color: s.text, fontSize: 12, fontWeight: 600, fontFamily: s.mono }}>{img.totalSize}</span>
              </div>
            </div>

            <div style={{
              marginTop: 12, background: s.bg, border: '1px solid ' + s.border, borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Layer Count</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 28, fontWeight: 700 }}>{img.layers.length}</div>
            </div>

            <div style={{ marginTop: 16, borderTop: '1px solid ' + s.border, paddingTop: 12 }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Compare</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {imageKeys.map((key) => {
                  const data = images[key]
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: 11,
                      color: key === activeKey ? s.accent : s.text3, fontWeight: key === activeKey ? 600 : 400,
                    }}>
                      <span>{data.name}</span>
                      <span style={{ fontFamily: s.mono }}>{data.totalSize}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

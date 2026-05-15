import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-docker'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Layer {
  name: string
  size: number
  stage: 'builder' | 'final'
  discarded: boolean
  highlighted: boolean
}

const dockerfile = `FROM golang:1.21 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /app /app
EXPOSE 8080
ENTRYPOINT ["/app"]`

const singleStageDockerfile = `FROM golang:1.21
WORKDIR /src
COPY . .
RUN go build -o /app
EXPOSE 8080
ENTRYPOINT ["/app"]`

const builderLayers: Layer[] = [
  { name: 'golang:1.21 base', size: 625, stage: 'builder', discarded: true, highlighted: false },
  { name: 'WORKDIR /src', size: 0, stage: 'builder', discarded: true, highlighted: false },
  { name: 'COPY go.mod go.sum', size: 0, stage: 'builder', discarded: true, highlighted: false },
  { name: 'RUN go mod download', size: 350, stage: 'builder', discarded: true, highlighted: false },
  { name: 'COPY .', size: 2, stage: 'builder', discarded: true, highlighted: false },
  { name: 'go build -o /app', size: 85, stage: 'builder', discarded: true, highlighted: false },
]

const finalLayers: Layer[] = [
  { name: 'alpine:3.19 base', size: 7, stage: 'final', discarded: false, highlighted: false },
  { name: 'ca-certificates', size: 1, stage: 'final', discarded: false, highlighted: false },
  { name: 'COPY --from=builder /app', size: 18, stage: 'final', discarded: false, highlighted: true },
  { name: 'EXPOSE 8080', size: 0, stage: 'final', discarded: false, highlighted: false },
  { name: 'ENTRYPOINT', size: 0, stage: 'final', discarded: false, highlighted: false },
]

const singleStageLayers = [
  { name: 'golang:1.21 base', size: 625 },
  { name: 'WORKDIR /src', size: 0 },
  { name: 'COPY . + deps', size: 350 },
  { name: 'go build -o /app', size: 85 },
  { name: 'EXPOSE + ENTRYPOINT', size: 0 },
]

export default function MultiStageDemo() {
  const [view, setView] = useState<'multi' | 'single'>('multi')
  const [highlightCopy, setHighlightCopy] = useState(false)

  const highlightedDockerfile = useMemo(() =>
    Prism.highlight(dockerfile, Prism.languages.docker, 'docker'),
    []
  )

  const highlightedSingle = useMemo(() =>
    Prism.highlight(singleStageDockerfile, Prism.languages.docker, 'docker'),
    []
  )

  const builderTotal = builderLayers.reduce((sum, l) => sum + l.size, 0)
  const finalTotal = finalLayers.reduce((sum, l) => sum + l.size, 0)
  const singleTotal = singleStageLayers.reduce((sum, l) => sum + l.size, 0)
  const maxSize = Math.max(builderTotal, singleTotal)

  return (
    <DemoBoundary name="Multi-Stage Build">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <style>{`
        code .token.keyword { color: #f92672; }
        code .token.string { color: #e6db74; }
        code .token.number { color: #ae81ff; }
        code .token.function { color: #a6e22e; }
        code .token.operator { color: #f8f8f2; }
        code .token.comment { color: #75715e; font-style: italic; }
        code .token.builtin { color: #fd971f; }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Multi-Stage Builds</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Separate build environment from runtime. Copy only the compiled binary into a minimal base image.
      </p>

      <div style={{ display: 'flex', gap: 4, background: s.bg2, borderRadius: 8, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        <button
          onClick={() => setView('multi')}
          style={{
            background: view === 'multi' ? s.accent : 'transparent',
            border: 'none', borderRadius: 6, padding: '6px 16px',
            color: view === 'multi' ? '#fff' : s.text2,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Multi-Stage
        </button>
        <button
          onClick={() => setView('single')}
          style={{
            background: view === 'single' ? s.accent : 'transparent',
            border: 'none', borderRadius: 6, padding: '6px 16px',
            color: view === 'single' ? '#fff' : s.text2,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Single-Stage
        </button>
      </div>

      {view === 'multi' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
              <div style={{ color: s.orange, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Builder Stage
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {builderLayers.map((layer, i) => (
                  <div key={i} style={{
                    background: s.bg, border: `1px solid ${layer.discarded ? s.border : s.border2}`,
                    borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: s.mono,
                    color: layer.discarded ? s.text3 : s.text,
                    opacity: layer.discarded ? 0.6 : 1,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: layer.discarded ? s.text3 : s.orange }}>{layer.name}</span>
                    {layer.size > 0 && <span style={{ color: s.text3 }}>{layer.size} MB</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: s.bg, borderRadius: 8, border: `1px solid ${s.red}`, color: s.red, fontSize: 11, fontFamily: s.mono, textAlign: 'center' }}>
                DISCARDED: {builderTotal} MB
              </div>
            </div>

            <div style={{ background: s.bg2, borderRadius: 12, padding: 16, border: `1px solid ${highlightCopy ? s.green : 'transparent'}`, transition: 'border-color 0.3s' }}
              onMouseEnter={() => setHighlightCopy(true)}
              onMouseLeave={() => setHighlightCopy(false)}
            >
              <div style={{ color: s.green, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Final Stage
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {finalLayers.map((layer, i) => (
                  <div key={i} style={{
                    background: s.bg, border: `1px solid ${layer.highlighted && highlightCopy ? s.green : s.border}`,
                    borderRadius: 6, padding: '6px 10px', fontSize: 11, fontFamily: s.mono,
                    color: s.text,
                    transition: 'all 0.3s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: layer.highlighted && highlightCopy ? `0 0 12px ${s.green}33` : 'none',
                  }}>
                    <span style={{ color: layer.highlighted && highlightCopy ? s.green : s.text }}>{layer.name}</span>
                    {layer.size > 0 && <span style={{ color: s.text3 }}>{layer.size} MB</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: s.bg, borderRadius: 8, border: `1px solid ${s.green}`, color: s.green, fontSize: 11, fontFamily: s.mono, textAlign: 'center' }}>
                FINAL IMAGE: {finalTotal} MB
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: s.text2, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Size Comparison</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, height: 32, background: s.bg3, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  width: `${(builderTotal / maxSize) * 100}%`,
                  height: '100%',
                  background: s.orange,
                  opacity: 0.6,
                  transition: 'width 0.5s',
                }} />
                <div style={{
                  width: `${(finalTotal / maxSize) * 100}%`,
                  height: '100%',
                  background: s.green,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, minWidth: 80, textAlign: 'right' }}>
                <span style={{ color: s.orange }}>{builderTotal} MB</span>
                {' -> '}
                <span style={{ color: s.green }}>{finalTotal} MB</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.orange, opacity: 0.6 }} />
                <span style={{ color: s.text3, fontSize: 11 }}>Discarded ({builderTotal - finalTotal} MB saved)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.green }} />
                <span style={{ color: s.text3, fontSize: 11 }}>Final image</span>
              </div>
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Dockerfile (multi-stage)
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14, fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre', fontFamily: s.mono, color: s.text, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedDockerfile }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ color: s.red, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Single-Stage: Everything in One Image
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {singleStageLayers.map((layer, i) => (
                <div key={i} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '6px 10px', fontSize: 11, fontFamily: s.mono,
                  color: s.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{layer.name}</span>
                  {layer.size > 0 && <span style={{ color: s.text3 }}>{layer.size} MB</span>}
                </div>
              ))}
            </div>
            <div style={{
              padding: '8px 10px', background: s.bg, borderRadius: 8,
              border: `1px solid ${s.red}`, color: s.red, fontSize: 11, fontFamily: s.mono, textAlign: 'center',
            }}>
              TOTAL: {singleTotal} MB (includes Go compiler, SDK, source code)
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: s.text2, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Size Comparison
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, height: 32, background: s.bg3, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  width: `${(singleTotal / maxSize) * 100}%`,
                  height: '100%',
                  background: s.red,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, minWidth: 100, textAlign: 'right' }}>
                <span style={{ color: s.red }}>{singleTotal} MB</span>
                {' vs '}
                <span style={{ color: s.green }}>{finalTotal} MB</span>
              </div>
            </div>
            <div style={{ marginTop: 6, color: s.text3, fontSize: 11 }}>
              Single-stage image is <strong style={{ color: s.red }}>{singleTotal}x</strong> larger than multi-stage ({Math.round(singleTotal / finalTotal)}x)
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Dockerfile (single-stage)
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14, fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre', fontFamily: s.mono, color: s.text, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedSingle }} />
            </div>
          </div>
        </>
      )}

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Takeaway</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.orange, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Builder Stage</div>
            <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.5 }}>
              Has Go compiler, full SDK, source code, and dependencies. Produces the binary, but the entire stage is discarded.
            </div>
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.green, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Final Stage</div>
            <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.5 }}>
              Tiny Alpine base + compiled binary. No compilers, no source code. Only what is needed to run.
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

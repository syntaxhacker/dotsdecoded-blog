import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const words = ["I", "love", "AI"]
const attentionWeights = [
  [0.070, 0.707, 0.223],
  [0.333, 0.333, 0.333],
  [0.168, 0.533, 0.299],
]
const wordColors = [s.accent, s.green, s.purple]
const CW = 820
const CH = 280
const nodePos = [
  { x: 140, y: 140 },
  { x: 410, y: 140 },
  { x: 680, y: 140 },
]

interface Particle {
  targetIdx: number
  progress: number
  speed: number
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
}

function bezAt(t: number, p0: number, p1: number, p2: number, p3: number) {
  const m = 1 - t
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3
}

function getCP(fi: number, ti: number) {
  const from = nodePos[fi]
  const to = nodePos[ti]
  const dx = to.x - from.x
  const dist = Math.abs(dx)
  const off = dist * 0.4
  return {
    cp1x: from.x + dx * 0.3,
    cp1y: from.y - off,
    cp2x: from.x + dx * 0.7,
    cp2y: to.y - off,
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function hexAlpha(hex: string, alpha: number) {
  return hex + Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')
}

export default function AttentionFlowDemo() {
  const [sel, setSel] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const glowRef = useRef([0, 0, 0])
  const rafRef = useRef(0)

  useEffect(() => {
    const weights = attentionWeights[sel]
    const particles: Particle[] = []
    for (let i = 0; i < 3; i++) {
      if (i === sel) continue
      const w = weights[i]
      const count = Math.max(2, Math.round(w * 15))
      const { cp1x, cp1y, cp2x, cp2y } = getCP(sel, i)
      for (let j = 0; j < count; j++) {
        particles.push({
          targetIdx: i,
          progress: j / count,
          speed: 0.002 + Math.random() * 0.004,
          cp1x, cp1y, cp2x, cp2y,
        })
      }
    }
    particlesRef.current = particles
    glowRef.current = [0, 0, 0]
  }, [sel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = CW * dpr
    canvas.height = CH * dpr
    ctx.scale(dpr, dpr)

    function draw() {
      const particles = particlesRef.current
      const glow = glowRef.current
      const weights = attentionWeights[sel]

      ctx.clearRect(0, 0, CW, CH)

      for (let i = 0; i < 3; i++) {
        if (i === sel) continue
        const w = weights[i]
        const from = nodePos[sel]
        const to = nodePos[i]
        const { cp1x, cp1y, cp2x, cp2y } = getCP(sel, i)

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y)
        ctx.strokeStyle = hexAlpha(wordColors[sel], 0.25)
        ctx.lineWidth = w * 8
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      for (const p of particles) {
        p.progress += p.speed
        if (p.progress >= 1) {
          p.progress -= 1
          glow[p.targetIdx] = Math.min(1, glow[p.targetIdx] + 0.4)
        }

        const from = nodePos[sel]
        const to = nodePos[p.targetIdx]
        const px = bezAt(p.progress, from.x, p.cp1x, p.cp2x, to.x)
        const py = bezAt(p.progress, from.y, p.cp1y, p.cp2y, to.y)
        const alpha = Math.min(1, p.progress * 4) * Math.min(1, (1 - p.progress) * 4)

        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = hexAlpha(wordColors[sel], alpha * 0.85)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = hexAlpha(wordColors[sel], alpha * 0.15)
        ctx.fill()
      }

      for (let i = 0; i < 3; i++) {
        glow[i] = Math.max(0, glow[i] - 0.015)
      }

      for (let i = 0; i < 3; i++) {
        const pos = nodePos[i]
        const nw = 84
        const nh = 46
        const nx = pos.x - nw / 2
        const ny = pos.y - nh / 2

        if (i === sel) {
          ctx.shadowColor = wordColors[i]
          ctx.shadowBlur = 24
        } else if (glow[i] > 0) {
          ctx.shadowColor = wordColors[sel]
          ctx.shadowBlur = glow[i] * 28
        }

        roundRect(ctx, nx, ny, nw, nh, 10)
        ctx.fillStyle = s.bg2
        ctx.fill()

        if (i === sel) {
          ctx.strokeStyle = wordColors[i]
          ctx.lineWidth = 2
        } else if (glow[i] > 0) {
          ctx.strokeStyle = hexAlpha(wordColors[sel], 0.3 + glow[i] * 0.7)
          ctx.lineWidth = 1.5
        } else {
          ctx.strokeStyle = s.border
          ctx.lineWidth = 1
        }
        ctx.stroke()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0

        ctx.fillStyle = i === sel ? s.text : s.text2
        ctx.font = `600 18px ${s.mono}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(words[i], pos.x, pos.y + 1)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [sel])

  const weights = attentionWeights[sel]

  return (
    <DemoBoundary name="Attention Flow">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: 'visible' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {words.map((w, i) => (
            <button
              key={w}
              onClick={() => setSel(i)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: `1px solid ${sel === i ? wordColors[i] : s.border}`,
                background: sel === i ? hexAlpha(wordColors[i], 0.12) : s.bg2,
                color: sel === i ? wordColors[i] : s.text3,
                fontSize: 14,
                fontWeight: 600 as const,
                cursor: 'pointer',
                fontFamily: s.mono,
                transition: 'all 0.2s',
              }}
            >
              Source: {w}
            </button>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 12, border: `1px solid ${s.border}` }}>
          <canvas
            ref={canvasRef}
            style={{ width: CW, height: CH, display: 'block', touchAction: 'pan-y' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          {words.map((w, i) => {
            if (i === sel) return null
            return (
              <div key={`${sel}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: wordColors[sel],
                  opacity: 0.3 + weights[i] * 0.7,
                }} />
                <span style={{ color: s.text2, fontSize: 13, fontFamily: s.mono }}>
                  {words[sel]} → {w}: <span style={{ color: s.text, fontWeight: 600 as const }}>{(weights[i] * 100).toFixed(1)}%</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </DemoBoundary>
  )
}

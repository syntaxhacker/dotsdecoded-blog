import { useEffect, useRef, useState, useCallback } from 'react'
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

interface TagData {
  name: string
  count: number
}

interface EdgeData {
  source: string
  target: string
  weight: number
}

interface Props {
  tags: TagData[]
  edges: EdgeData[]
}

interface SimNode {
  name: string
  count: number
  x: number
  y: number
  radius: number
  clusterIndex: number
  degree: number
}

interface ShapeEdge {
  source: string
  target: string
}

const CLUSTERS = [
  { name: 'Rails', color: '#e85d5d', lightColor: '#d94444', tags: ['rails', 'ruby', 'fundamentals', 'backend', 'authentication', 'security'] },
  { name: 'Systems', color: '#5b8def', lightColor: '#4a7ce0', tags: ['system-design', 'interview', 'design-problem', 'architecture', 'caching', 'devops', 'networking'] },
  { name: 'AI', color: '#9b7bea', lightColor: '#8a6adb', tags: ['ai', 'llm', 'machine-learning'] },
  { name: 'Frontend', color: '#3dd68c', lightColor: '#2bc07a', tags: ['css', 'frontend', 'layout', 'javascript'] },
  { name: 'Data', color: '#e8945a', lightColor: '#d7803f', tags: ['databases', 'performance', 'streaming', 'real-time', 'design-patterns'] },
]

function buildSimNodes(
  tags: TagData[],
  edges: EdgeData[],
  w: number,
  h: number,
  p: { minRadius: number; maxRadius: number; labelThreshold: number; padding: number }
): { nodes: SimNode[]; shapeEdges: ShapeEdge[]; clusterAssignments: Map<string, number> } {
  const adjacency = new Map<string, Set<string>>()
  for (const t of tags) adjacency.set(t.name, new Set())
  for (const e of edges) {
    adjacency.get(e.source)?.add(e.target)
    adjacency.get(e.target)?.add(e.source)
  }

  const degreeMap = new Map<string, number>()
  for (const t of tags) degreeMap.set(t.name, adjacency.get(t.name)?.size || 0)

  const tagToCluster = new Map<string, number>()
  const clusterTags: TagData[][] = CLUSTERS.map(() => [])

  for (const t of tags) {
    let assigned = false
    for (let ci = 0; ci < CLUSTERS.length; ci++) {
      if (CLUSTERS[ci].tags.includes(t.name)) {
        tagToCluster.set(t.name, ci)
        clusterTags[ci].push(t)
        assigned = true
        break
      }
    }
    if (!assigned) {
      tagToCluster.set(t.name, CLUSTERS.length - 1)
      clusterTags[CLUSTERS.length - 1].push(t)
    }
  }

  const activeClusters = CLUSTERS.map((_, ci) => clusterTags[ci].length > 0 ? ci : -1).filter(ci => ci !== -1)
  const N = activeClusters.length
  const aspectRatio = w / h
  const cols = Math.max(1, Math.ceil(Math.sqrt(N * aspectRatio)))
  const rows = Math.max(1, Math.ceil(N / cols))
  const cellW = w / cols
  const cellH = h / rows

  const allMaxDegree = Math.max(...tags.map(t => degreeMap.get(t.name) || 0), 1)

  const nodes: SimNode[] = []
  const shapeEdges: ShapeEdge[] = []
  const clusterAssignments = new Map<string, number>()

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col
      if (idx >= N) break
      const ci = activeClusters[idx]
      const cTags = clusterTags[ci]
      if (cTags.length === 0) continue

      const sorted = [...cTags].sort((a, b) => (degreeMap.get(b.name) || 0) - (degreeMap.get(a.name) || 0))

      const cellCenterX = col * cellW + cellW / 2
      const cellCenterY = row * cellH + cellH / 2
      const padX = cellW * p.padding
      const padY = cellH * p.padding
      const innerW = cellW - padX * 2
      const innerH = cellH - padY * 2

      const maxRadiusForCell = Math.min(innerW, innerH) / (sorted.length <= 1 ? 2 : Math.max(2, sorted.length * 0.8))
      const maxR = Math.min(p.maxRadius, maxRadiusForCell * 0.5)
      const minR = Math.min(p.minRadius, maxR * 0.6)

      const circleRadius = sorted.length <= 1 ? 0 : Math.min(innerW, innerH) * 0.38

      const startIdx = nodes.length

      for (let i = 0; i < sorted.length; i++) {
        const tag = sorted[i]
        const deg = degreeMap.get(tag.name) || 0
        const r = minR + (deg / allMaxDegree) * (maxR - minR)

        let x: number
        let y: number
        if (sorted.length === 1) {
          x = cellCenterX
          y = cellCenterY
        } else {
          const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2
          x = cellCenterX + Math.cos(angle) * circleRadius
          y = cellCenterY + Math.sin(angle) * circleRadius
        }

        nodes.push({ name: tag.name, count: tag.count, x, y, radius: r, clusterIndex: ci, degree: deg })
        clusterAssignments.set(tag.name, ci)
      }

      for (let i = startIdx; i < nodes.length - 1; i++) {
        shapeEdges.push({ source: nodes[i].name, target: nodes[i + 1].name })
      }
    }
  }

  return { nodes, shapeEdges, clusterAssignments }
}

function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

function getThemeColors(dark: boolean) {
  if (dark) {
    return {
      bg: s.bg,
      clusterColors: CLUSTERS.map(c => c.color),
      edgeColor: s.border2,
      crossEdgeColor: '#2a3040',
      tooltipBg: s.bg2,
      tooltipBorder: s.border,
      tooltipText: s.text,
      tooltipSub: s.text2,
    }
  }
  return {
    bg: '#fafafa',
    clusterColors: CLUSTERS.map(c => c.lightColor),
    edgeColor: '#d4d4d8',
    crossEdgeColor: '#e8e8ec',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e4e4e7',
    tooltipText: '#18181b',
    tooltipSub: '#71717a',
  }
}

function getClusterForTag(tagName: string): number {
  for (let ci = 0; ci < CLUSTERS.length; ci++) {
    if (CLUSTERS[ci].tags.includes(tagName)) return ci
  }
  return CLUSTERS.length - 1
}

export default function TagGraphDemo({ tags, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<SimNode[]>([])
  const shapeEdgesRef = useRef<ShapeEdge[]>([])
  const clusterAssignmentsRef = useRef<Map<string, number>>(new Map())
  const baseNodesRef = useRef<SimNode[]>([])
  const hoveredRef = useRef<string | null>(null)
  const highlightedTagsRef = useRef<Set<string>>(new Set())
  const sizeRef = useRef({ w: 400, h: 400 })
  const drawRef = useRef<() => void>(() => {})
  const guiRef = useRef<any>(null)
  const [theme, setTheme] = useState(isDarkTheme())
  const themeRef = useRef(theme)

  themeRef.current = theme

  const detectTheme = useCallback(() => {
    setTheme(isDarkTheme())
    requestAnimationFrame(() => drawRef.current())
  }, [])

  useEffect(() => {
    const onThemeChange = () => detectTheme()
    window.addEventListener('themechange', onThemeChange)
    const mo = new MutationObserver(() => detectTheme())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      window.removeEventListener('themechange', onThemeChange)
      mo.disconnect()
    }
  }, [detectTheme])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const defaults = {
      minRadius: 14,
      maxRadius: 28,
      labelThreshold: 3,
      padding: 0.15,
      edgeOpacity: 0.12,
      edgeHoverOpacity: 0.75,
      dimOpacity: 0.1,
      crossEdgeOpacity: 0.04,
      animSpeed: 0.0008,
      driftRange: 8,
    }

    const params = { ...defaults }

    let gui: any = null
    if (import.meta.env.DEV) {
      if (guiRef.current) guiRef.current.destroy()
      import('lil-gui').then((mod) => {
        gui = new mod.default({ title: 'Tag Graph' })
        guiRef.current = gui
        const layoutFolder = gui.addFolder('Layout')
        layoutFolder.add(params, 'minRadius', 6, 30, 1).name('Min Radius').onChange(rebuild)
        layoutFolder.add(params, 'maxRadius', 10, 50, 1).name('Max Radius').onChange(rebuild)
        layoutFolder.add(params, 'labelThreshold', 1, 10, 1).name('Label Degree').onChange(render)
        layoutFolder.add(params, 'padding', 0.05, 0.35, 0.01).name('Padding').onChange(rebuild)
        layoutFolder.open()

        const animFolder = gui.addFolder('Animation')
        animFolder.add(params, 'animSpeed', 0, 0.005, 0.0001).name('Speed')
        animFolder.add(params, 'driftRange', 0, 30, 0.5).name('Drift')

        const styleFolder = gui.addFolder('Style')
        styleFolder.add(params, 'edgeOpacity', 0, 0.5, 0.01).name('Edge Alpha').onChange(render)
        styleFolder.add(params, 'edgeHoverOpacity', 0.1, 1, 0.01).name('Hover Edge').onChange(render)
        styleFolder.add(params, 'dimOpacity', 0, 0.2, 0.01).name('Dim Alpha').onChange(render)
        styleFolder.add(params, 'crossEdgeOpacity', 0, 0.15, 0.01).name('Cross Edge').onChange(render)

        gui.add(
          {
            reset() {
              Object.assign(params, defaults)
              gui.controllersRecursive().forEach((c: any) => c.updateDisplay())
              rebuild()
            },
          },
          'reset'
        ).name('Reset')

        gui.add(
          {
            copy() {
              const json = JSON.stringify(params, null, 2)
              navigator.clipboard.writeText(json).then(() => {
                const title = gui.domElement.querySelector('.title')
                if (title) {
                  const orig = title.textContent
                  title.textContent = 'Copied!'
                  setTimeout(() => { title.textContent = orig }, 1200)
                }
              })
            },
          },
          'copy'
        ).name('Copy Config')
      })
    }

    const refSize = 800

    let animFrame = 0
    const phaseSeeds: number[] = []

    function rebuild() {
      resize()
      const { w, h } = sizeRef.current
      const scale = Math.min(w, h) / refSize
      const clamped = Math.max(scale, 0.45)
      const scaledParams = {
        minRadius: params.minRadius * clamped,
        maxRadius: Math.min(params.maxRadius * clamped, 36),
        labelThreshold: params.labelThreshold,
        padding: params.padding,
      }
      const result = buildSimNodes(tags, edges, w, h, scaledParams)
      baseNodesRef.current = result.nodes.map(n => ({ ...n }))
      nodesRef.current = result.nodes.map(n => ({ ...n }))
      shapeEdgesRef.current = result.shapeEdges
      clusterAssignmentsRef.current = result.clusterAssignments

      if (phaseSeeds.length !== result.nodes.length) {
        phaseSeeds.length = 0
        for (let i = 0; i < result.nodes.length; i++) {
          phaseSeeds.push(Math.random() * Math.PI * 2)
        }
      }
    }

    function tick(time: number) {
      const base = baseNodesRef.current
      const live = nodesRef.current
      for (let i = 0; i < base.length; i++) {
        const b = base[i]
        const seed = phaseSeeds[i] || 0
        live[i].x = b.x + Math.sin(time * params.animSpeed + seed) * params.driftRange
        live[i].y = b.y + Math.cos(time * params.animSpeed * 0.7 + seed * 1.3) * params.driftRange
      }
      draw()
      animFrame = requestAnimationFrame(tick)
    }

    const edgeMap = new Map<string, number>()
    const adjacency = new Map<string, Set<string>>()

    for (const t of tags) {
      adjacency.set(t.name, new Set())
    }
    for (const e of edges) {
      const key = e.source < e.target ? `${e.source}||${e.target}` : `${e.target}||${e.source}`
      edgeMap.set(key, e.weight)
      adjacency.get(e.source)?.add(e.target)
      adjacency.get(e.target)?.add(e.source)
    }

    const maxWeight = Math.max(...edges.map((e) => e.weight), 1)
    const maxCount = Math.max(...tags.map((t) => t.count), 1)

    function render() {
      draw()
    }

    function resize() {
      const rect = container.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      sizeRef.current = { w, h }
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    rebuild()
    animFrame = requestAnimationFrame(tick)

    function draw() {
      const nodes = nodesRef.current
      const assignments = clusterAssignmentsRef.current
      const { w, h } = sizeRef.current
      const tc = getThemeColors(themeRef.current)
      const hovered = hoveredRef.current
      const dark = themeRef.current

      ctx.clearRect(0, 0, w, h)

      const shapeKeys = new Set<string>()
      for (const se of shapeEdgesRef.current) {
        const k = se.source < se.target ? `${se.source}||${se.target}` : `${se.target}||${se.source}`
        shapeKeys.add(k)
      }

      const connectedSet = new Set<string>()
      if (hovered) {
        connectedSet.add(hovered)
        const adj = adjacency.get(hovered)
        if (adj) adj.forEach((t) => connectedSet.add(t))
      }
      const highlightedTags = highlightedTagsRef.current
      if (highlightedTags.size > 0) {
        highlightedTags.forEach((tag) => {
          connectedSet.add(tag)
          const adj = adjacency.get(tag)
          if (adj) adj.forEach((t) => connectedSet.add(t))
        })
      }
      const hasHighlight = hovered !== null || highlightedTags.size > 0

      for (const e of edges) {
        const k = e.source < e.target ? `${e.source}||${e.target}` : `${e.target}||${e.source}`
        if (shapeKeys.has(k)) continue
        const a = nodes.find((n) => n.name === e.source)
        const b = nodes.find((n) => n.name === e.target)
        if (!a || !b) continue

        const sameCluster = a.clusterIndex === b.clusterIndex
        const isHighlighted = hasHighlight && connectedSet.has(e.source) && connectedSet.has(e.target)
        const isDimmed = hasHighlight && !isHighlighted

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineWidth = 1 + (e.weight / maxWeight) * 1.5

        if (isHighlighted) {
          const ci = a.clusterIndex
          ctx.strokeStyle = tc.clusterColors[ci] || tc.edgeColor
          ctx.globalAlpha = params.edgeHoverOpacity
        } else if (isDimmed) {
          ctx.strokeStyle = sameCluster ? (tc.clusterColors[a.clusterIndex] || tc.edgeColor) : tc.crossEdgeColor
          ctx.globalAlpha = params.dimOpacity
        } else if (sameCluster) {
          ctx.strokeStyle = tc.clusterColors[a.clusterIndex] || tc.edgeColor
          ctx.globalAlpha = params.edgeOpacity
        } else {
          ctx.strokeStyle = tc.crossEdgeColor
          ctx.globalAlpha = params.crossEdgeOpacity
        }

        ctx.stroke()
        ctx.globalAlpha = 1
      }

      const shapeNodes = nodesRef.current
      for (const se of shapeEdgesRef.current) {
        const a = shapeNodes.find((n) => n.name === se.source)
        const b = shapeNodes.find((n) => n.name === se.target)
        if (!a || !b) continue

        const isHighlighted = hasHighlight && connectedSet.has(se.source) && connectedSet.has(se.target)
        const isDimmed = hasHighlight && !isHighlighted

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineWidth = 1.5

        const ci = a.clusterIndex
        const cc = tc.clusterColors[ci] || tc.edgeColor

        if (isHighlighted) {
          ctx.strokeStyle = cc
          ctx.globalAlpha = 0.9
        } else if (isDimmed) {
          ctx.strokeStyle = cc
          ctx.globalAlpha = 0.12
        } else {
          ctx.strokeStyle = cc
          ctx.globalAlpha = 0.35
        }

        ctx.stroke()
        ctx.globalAlpha = 1
      }

      for (const nd of nodes) {
        const isHovered = nd.name === hovered
        const isConnected = hasHighlight && connectedSet.has(nd.name)
        const isDimmed = hasHighlight && !isHovered && !isConnected

        const cc = tc.clusterColors[nd.clusterIndex] || tc.edgeColor
        let alpha = 0.5 + (nd.count / maxCount) * 0.5
        if (isHovered) alpha = 1
        else if (isDimmed) alpha = 0.2
        else if (isConnected) alpha = 1

        if (isHovered) {
          ctx.shadowColor = cc
          ctx.shadowBlur = 20
        }

        ctx.beginPath()
        ctx.arc(nd.x, nd.y, nd.radius, 0, Math.PI * 2)
        ctx.globalAlpha = alpha
        ctx.fillStyle = cc
        ctx.fill()
        ctx.lineWidth = isHovered ? 2 : 1.5
        ctx.strokeStyle = cc
        ctx.globalAlpha = isHovered ? 1 : alpha * 0.6
        ctx.stroke()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      const tooltip = tooltipRef.current
      if (tooltip && hovered) {
        const nd = nodes.find((n) => n.name === hovered)
        if (nd) {
          const ci = nd.clusterIndex
          const clusterName = CLUSTERS[ci]?.name || 'Other'
          const clusterColor = tc.clusterColors[ci] || tc.edgeColor

          tooltip.style.display = 'block'
          tooltip.style.left = nd.x + 'px'
          tooltip.style.top = nd.y - nd.radius - 56 + 'px'
          tooltip.style.transform = 'translateX(-50%)'
          const displayName = nd.name.replace(/\b\w/g, c => c.toUpperCase())
          tooltip.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${clusterColor}"></span><span style="font-size:10px;font-weight:600;color:${clusterColor};text-transform:uppercase;letter-spacing:0.5px">${clusterName}</span></div><div style="font-weight:700;color:${tc.tooltipText};font-size:13px">${displayName}</div><div style="color:${tc.tooltipSub};font-size:11px">${nd.count} post${nd.count !== 1 ? 's' : ''}</div>`
          tooltip.style.background = tc.tooltipBg
          tooltip.style.borderColor = tc.tooltipBorder
        }
      } else if (tooltip) {
        tooltip.style.display = 'none'
      }
    }

    drawRef.current = render

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let found: string | null = null
      for (const nd of nodesRef.current) {
        const dx = mx - nd.x
        const dy = my - nd.y
        if (dx * dx + dy * dy <= nd.radius * nd.radius) {
          found = nd.name
          break
        }
      }
      hoveredRef.current = found
      canvas.style.cursor = found ? 'pointer' : 'default'
      window.dispatchEvent(new CustomEvent('taghover', { detail: { tag: found } }))
      render()
    }

    function onMouseLeave() {
      hoveredRef.current = null
      canvas.style.cursor = 'default'
      window.dispatchEvent(new CustomEvent('taghover', { detail: { tag: null } }))
      render()
    }

    function onClick() {
      const h = hoveredRef.current
      if (h) {
        window.dispatchEvent(new CustomEvent('tagfilter', { detail: { tag: h } }))
      }
    }

    function onPostHover(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail && Array.isArray(detail.tags)) {
        highlightedTagsRef.current = new Set(detail.tags as string[])
      } else {
        highlightedTagsRef.current = new Set()
      }
      render()
    }

    const ro = new ResizeObserver(rebuild)
    ro.observe(container)

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('click', onClick)
    window.addEventListener('posthover', onPostHover)

    return () => {
      cancelAnimationFrame(animFrame)
      ro.disconnect()
      if (guiRef.current) {
        guiRef.current.destroy()
        guiRef.current = null
      }
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('posthover', onPostHover)
    }
  }, [tags, edges])

  return (
    <DemoBoundary name="Tag Graph">
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            display: 'none',
            pointerEvents: 'none',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid',
            fontSize: 12,
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </DemoBoundary>
  )
}

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
}

interface ShapeEdge {
  source: string
  target: string
}

function buildSimNodes(
  tags: TagData[],
  cx: number,
  cy: number,
  w: number,
  h: number,
  p: { verticalHeight: number; horizontalWidth: number; minRadius: number; maxRadius: number; linePadding: number }
): { nodes: SimNode[]; shapeEdges: ShapeEdge[] } {
  const maxCount = Math.max(...tags.map((t) => t.count), 1)
  const vh = h * p.verticalHeight
  const hw = w * p.horizontalWidth
  const sorted = [...tags].sort((a, b) => b.count - a.count)
  const topTags = sorted.filter((t) => t.count === maxCount)
  const restTags = sorted.filter((t) => t.count < maxCount)
  const nodes: SimNode[] = []
  const minSpacing = p.maxRadius * 2.4

  const padVH = vh * p.linePadding
  const lineTop = cy - vh + padVH
  const lineBot = cy + vh - padVH

  let lineSpacing: number
  let lineStartY: number
  if (topTags.length <= 1) {
    lineSpacing = 0
    lineStartY = cy
  } else {
    lineSpacing = Math.max((lineBot - lineTop) / (topTags.length - 1), minSpacing)
    const totalH = lineSpacing * (topTags.length - 1)
    lineStartY = cy - totalH / 2
  }

  for (let i = 0; i < topTags.length; i++) {
    const y = topTags.length === 1 ? cy : lineStartY + i * lineSpacing
    const tag = topTags[i]
    const r = p.minRadius + (tag.count / maxCount) * (p.maxRadius - p.minRadius)
    nodes.push({ name: tag.name, count: tag.count, x: cx - hw, y, radius: r })
  }

  const shapeEdges: ShapeEdge[] = []

  for (let i = 0; i < nodes.length - 1; i++) {
    if (i < topTags.length - 1) {
      shapeEdges.push({ source: nodes[i].name, target: nodes[i + 1].name })
    }
  }

  const arcStartIdx = nodes.length

  const arcCX = cx - hw
  const arcRX = hw * 2
  const arcRY = vh

  const padAngle = p.linePadding * 0.6
  const aFullStart = -Math.PI / 2 + padAngle
  const aFullEnd = Math.PI / 2 - padAngle
  const aFullRange = aFullEnd - aFullStart

  const approxArcLen = Math.PI * Math.sqrt((arcRX * arcRX + arcRY * arcRY) / 2)
  const minAngStep = approxArcLen > 0 ? (minSpacing / approxArcLen) * aFullRange : 0

  let angStep: number
  let angStart: number
  if (restTags.length <= 1) {
    angStep = 0
    angStart = 0
  } else {
    angStep = Math.max(aFullRange / (restTags.length - 1), minAngStep)
    const totalAng = angStep * (restTags.length - 1)
    angStart = -Math.PI / 2 + (Math.PI - totalAng) / 2
  }

  for (let i = 0; i < restTags.length; i++) {
    const angle = restTags.length === 1 ? 0 : angStart + i * angStep
    const tag = restTags[i]
    const r = p.minRadius + (tag.count / maxCount) * (p.maxRadius - p.minRadius)
    nodes.push({
      name: tag.name,
      count: tag.count,
      x: arcCX + Math.cos(angle) * arcRX,
      y: cy + Math.sin(angle) * arcRY,
      radius: r,
    })
  }

  for (let i = arcStartIdx; i < nodes.length - 1; i++) {
    shapeEdges.push({ source: nodes[i].name, target: nodes[i + 1].name })
  }

  if (topTags.length > 0 && nodes.length > arcStartIdx) {
    shapeEdges.push({ source: nodes[topTags.length - 1].name, target: nodes[arcStartIdx].name })
    shapeEdges.push({ source: nodes[0].name, target: nodes[nodes.length - 1].name })
  }

  return { nodes, shapeEdges }
}

function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

function getThemeColors(dark: boolean) {
  if (dark) {
    return {
      bg: s.bg,
      dotFill: s.accent,
      dotBorder: s.border2,
      labelText: s.text,
      edgeColor: s.border2,
      edgeHoverColor: s.accent,
      tooltipBg: s.bg2,
      tooltipBorder: s.border,
      tooltipText: s.text,
      tooltipSub: s.text2,
    }
  }
  return {
    bg: '#fafafa',
    dotFill: '#3b6ecf',
    dotBorder: '#c4c4cc',
    labelText: '#18181b',
    edgeColor: '#d4d4d8',
    edgeHoverColor: '#3b6ecf',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e4e4e7',
    tooltipText: '#18181b',
    tooltipSub: '#71717a',
  }
}

export default function TagGraphDemo({ tags, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
    const nodesRef = useRef<SimNode[]>([])
    const shapeEdgesRef = useRef<ShapeEdge[]>([])
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
      verticalHeight: 0.42,
      horizontalWidth: 0.23,
      minRadius: 26,
      maxRadius: 49,
      linePadding: 0.14,
      edgeOpacity: 0.09,
      edgeHoverOpacity: 0.81,
      dimOpacity: 0.13,
    }

    const params = { ...defaults }

    let gui: any = null
    if (import.meta.env.DEV) {
      if (guiRef.current) guiRef.current.destroy()
      import('lil-gui').then((mod) => {
        gui = new mod.default({ title: 'Tag Graph' })
        guiRef.current = gui
        const layoutFolder = gui.addFolder('Layout')
        layoutFolder.add(params, 'verticalHeight', 0.1, 0.5, 0.01).name('Height').onChange(rebuild)
        layoutFolder.add(params, 'horizontalWidth', 0.08, 0.4, 0.01).name('Width').onChange(rebuild)
        layoutFolder.add(params, 'minRadius', 6, 30, 1).name('Min Radius').onChange(rebuild)
        layoutFolder.add(params, 'maxRadius', 16, 60, 1).name('Max Radius').onChange(rebuild)
        layoutFolder.add(params, 'linePadding', 0, 0.4, 0.01).name('Line Pad').onChange(rebuild)
        layoutFolder.open()

        const styleFolder = gui.addFolder('Style')
        styleFolder.add(params, 'edgeOpacity', 0, 0.5, 0.01).name('Edge Alpha').onChange(render)
        styleFolder.add(params, 'edgeHoverOpacity', 0.1, 1, 0.01).name('Hover Edge').onChange(render)
        styleFolder.add(params, 'dimOpacity', 0, 0.2, 0.01).name('Dim Alpha').onChange(render)

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

    function rebuild() {
      resize()
      const { w, h } = sizeRef.current
      const result = buildSimNodes(tags, w / 2, h / 2, w, h, params)
      nodesRef.current = result.nodes
      shapeEdgesRef.current = result.shapeEdges
      render()
    }

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

    rebuild()

    function draw() {
      const nodes = nodesRef.current
      const { w, h } = sizeRef.current
      const tc = getThemeColors(themeRef.current)
      const hovered = hoveredRef.current

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

        const isHighlighted = hasHighlight && connectedSet.has(e.source) && connectedSet.has(e.target)
        const isDimmed = hasHighlight && !isHighlighted

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineWidth = 1 + (e.weight / maxWeight) * 1.5

        if (isHighlighted) {
          ctx.strokeStyle = tc.edgeHoverColor
          ctx.globalAlpha = params.edgeHoverOpacity
        } else if (isDimmed) {
          ctx.strokeStyle = tc.edgeColor
          ctx.globalAlpha = params.dimOpacity
        } else {
          ctx.strokeStyle = tc.edgeColor
          ctx.globalAlpha = params.edgeOpacity
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
        ctx.lineWidth = 2

        if (isHighlighted) {
          ctx.strokeStyle = tc.edgeHoverColor
          ctx.globalAlpha = 0.9
        } else if (isDimmed) {
          ctx.strokeStyle = tc.edgeHoverColor
          ctx.globalAlpha = 0.12
        } else {
          ctx.strokeStyle = tc.edgeHoverColor
          ctx.globalAlpha = 0.35
        }

        ctx.stroke()
        ctx.globalAlpha = 1
      }

      for (const nd of nodes) {
        const frac = nd.count / maxCount
        const isHovered = nd.name === hovered
        const isConnected = hasHighlight && connectedSet.has(nd.name)
        const isDimmed = hasHighlight && !isHovered && !isConnected

        let alpha = 0.45 + frac * 0.55
        if (isHovered) alpha = 1
        else if (isDimmed) alpha = 0.3
        else if (isConnected) alpha = 1

        if (isHovered) {
          ctx.shadowColor = tc.dotFill
          ctx.shadowBlur = 18
        }

        ctx.beginPath()
        ctx.arc(nd.x, nd.y, nd.radius, 0, Math.PI * 2)
        ctx.globalAlpha = alpha
        ctx.fillStyle = tc.dotFill
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = tc.dotBorder
        ctx.globalAlpha = alpha
        ctx.stroke()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1

        const showLabel = nd.radius > 18 || isHovered || isConnected
        if (showLabel) {
          const fontSize = nd.radius > 18 ? 10 + frac * 2 : 10
          ctx.font = `700 ${fontSize}px ${s.mono}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.globalAlpha = isDimmed ? 0.3 : 1
          ctx.fillStyle = tc.labelText

          const maxTextWidth = nd.radius * 1.7
          let displayName = nd.name
          while (ctx.measureText(displayName).width > maxTextWidth && displayName.length > 3) {
            displayName = displayName.slice(0, -1)
          }
          if (displayName !== nd.name) displayName += '..'

          ctx.fillText(displayName, nd.x, nd.y)
          ctx.globalAlpha = 1
        }
      }

      const tooltip = tooltipRef.current
      if (tooltip && hovered) {
        const nd = nodes.find((n) => n.name === hovered)
        if (nd) {
          tooltip.style.display = 'block'
          tooltip.style.left = nd.x + 'px'
          tooltip.style.top = nd.y - nd.radius - 44 + 'px'
          tooltip.style.transform = 'translateX(-50%)'
          tooltip.innerHTML = `<div style="font-weight:700;color:${tc.tooltipText};font-size:13px;margin-bottom:2px">${nd.name}</div><div style="color:${tc.tooltipSub};font-size:11px">${nd.count} post${nd.count !== 1 ? 's' : ''}</div>`
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
            padding: '6px 12px',
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

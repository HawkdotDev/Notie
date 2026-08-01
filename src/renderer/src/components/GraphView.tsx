import React, { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, ZoomIn, ZoomOut, Home, X } from 'lucide-react'

interface GraphNode {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface GraphLink {
  source: string
  target: string
}

interface GraphViewProps {
  workspacePath: string
  onNodeClick: (nodeId: string) => void
  onClose: () => void
}

export default function GraphView({
  workspacePath,
  onNodeClick,
  onClose
}: GraphViewProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [loading, setLoading] = useState(true)

  // Simulation physics parameters
  const repulsionStrength = 180
  const attractionStrength = 0.05
  const gravityStrength = 0.02
  const friction = 0.9

  // View state: pan (offsetX, offsetY) and scale (zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1.0 })
  const transformRef = useRef(transform)
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // Mouse drag states
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeDraggedNodeRef = useRef<GraphNode | null>(null)
  const hoveredNodeRef = useRef<GraphNode | null>(null)
  const isPanningRef = useRef(false)

  // Load graph data from main process
  const loadGraphData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.fs.getGraphData(workspacePath)

      // Seed positions in a circle so they don't overlap initially
      const width = canvasRef.current?.width || 800
      const height = canvasRef.current?.height || 600
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 3

      const graphNodes: GraphNode[] = data.nodes.map((node, i) => {
        const angle = (i / data.nodes.length) * Math.PI * 2
        return {
          id: node.id,
          name: node.name,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
          vx: 0,
          vy: 0,
          radius: 6
        }
      })

      setNodes(graphNodes)
      setLinks(data.links)
    } catch (err) {
      console.error('Failed to load graph data:', err)
    } finally {
      setLoading(false)
    }
  }, [workspacePath])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGraphData()
  }, [loadGraphData])

  // Main physics simulation loop
  useEffect(() => {
    if (nodes.length === 0) return

    let animationId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const runSimulation = (): void => {
      const w = canvas.width
      const h = canvas.height
      const centerX = w / 2
      const centerY = h / 2

      // 1. Calculate repulsion forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const distSqr = dx * dx + dy * dy || 1
          const dist = Math.sqrt(distSqr)

          if (dist < 300) {
            const force = repulsionStrength / distSqr
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            n1.vx -= fx
            n1.vy -= fy
            n2.vx += fx
            n2.vy += fy
          }
        }
      }

      // 2. Calculate attraction forces along link connections
      const nodeMap = new Map<string, GraphNode>()
      nodes.forEach((n) => nodeMap.set(n.id, n))

      for (const link of links) {
        const n1 = nodeMap.get(link.source)
        const n2 = nodeMap.get(link.target)
        if (n1 && n2) {
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = dist * attractionStrength
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          n1.vx += fx
          n1.vy += fy
          n2.vx -= fx
          n2.vy -= fy
        }
      }

      // 3. Gravity towards the screen center
      for (const node of nodes) {
        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * gravityStrength
        node.vy += dy * gravityStrength
      }

      // 4. Update positions with damping
      for (const node of nodes) {
        if (node === activeDraggedNodeRef.current) continue
        node.x += node.vx
        node.y += node.vy
        node.vx *= friction
        node.vy *= friction
      }

      // 5. Draw the graph
      ctx.clearRect(0, 0, w, h)
      ctx.save()

      // Apply zoom & pan transforms
      const { x, y, zoom } = transformRef.current
      ctx.translate(x, y)
      ctx.scale(zoom, zoom)

      // Highlight connections if hovered
      const hovered = hoveredNodeRef.current
      const connectedNodeIds = new Set<string>()
      if (hovered) {
        connectedNodeIds.add(hovered.id)
        links.forEach((l) => {
          if (l.source === hovered.id) connectedNodeIds.add(l.target)
          if (l.target === hovered.id) connectedNodeIds.add(l.source)
        })
      }

      // Draw links/edges
      ctx.lineWidth = 1
      for (const link of links) {
        const n1 = nodeMap.get(link.source)
        const n2 = nodeMap.get(link.target)
        if (n1 && n2) {
          const isHighlighted =
            hovered && (link.source === hovered.id || link.target === hovered.id)
          ctx.strokeStyle = isHighlighted ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.08)'
          ctx.beginPath()
          ctx.moveTo(n1.x, n1.y)
          ctx.lineTo(n2.x, n2.y)
          ctx.stroke()
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const isHovered = hovered && node.id === hovered.id
        const isConnected = hovered && connectedNodeIds.has(node.id)

        // Draw node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + (isHovered ? 2 : 0), 0, Math.PI * 2)
        if (isHovered) {
          ctx.fillStyle = '#c084fc'
          ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
          ctx.shadowBlur = 10
        } else if (isConnected) {
          ctx.fillStyle = '#a855f7'
          ctx.shadowBlur = 0
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
          ctx.shadowBlur = 0
        }
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw node name label
        ctx.font = '10px sans-serif'
        ctx.fillStyle = isHovered || isConnected ? '#e3e3e3' : 'rgba(255, 255, 255, 0.35)'
        ctx.textAlign = 'center'
        ctx.fillText(node.name, node.x, node.y - 12)
      }

      ctx.restore()
      animationId = requestAnimationFrame(runSimulation)
    }

    animationId = requestAnimationFrame(runSimulation)
    return () => cancelAnimationFrame(animationId)
  }, [nodes, links])

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = (): void => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Helper to convert screen mouse coords to Canvas graph coordinate space
  const getGraphCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top
    const { x, y, zoom } = transformRef.current
    return {
      x: (mouseX - x) / zoom,
      y: (mouseY - y) / zoom
    }
  }

  // Mouse handlers for zoom, pan, drag
  const handleMouseDown = (e: React.MouseEvent): void => {
    const coords = getGraphCoords(e.clientX, e.clientY)

    // Check if clicked inside a node
    let clickedNode: GraphNode | null = null
    for (const node of nodes) {
      const dx = coords.x - node.x
      const dy = coords.y - node.y
      if (dx * dx + dy * dy < (node.radius + 8) * (node.radius + 8)) {
        clickedNode = node
        break
      }
    }

    if (clickedNode) {
      activeDraggedNodeRef.current = clickedNode
    } else {
      isPanningRef.current = true
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    const canvas = canvasRef.current
    if (!canvas) return

    const coords = getGraphCoords(e.clientX, e.clientY)

    // Handle node hover checks
    let foundHover: GraphNode | null = null
    for (const node of nodes) {
      const dx = coords.x - node.x
      const dy = coords.y - node.y
      if (dx * dx + dy * dy < (node.radius + 8) * (node.radius + 8)) {
        foundHover = node
        break
      }
    }
    hoveredNodeRef.current = foundHover

    if (!dragStartRef.current) return

    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    if (activeDraggedNodeRef.current) {
      // Drag node
      activeDraggedNodeRef.current.x = coords.x
      activeDraggedNodeRef.current.y = coords.y
    } else if (isPanningRef.current) {
      // Pan camera
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }))
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: React.MouseEvent): void => {
    if (dragStartRef.current) {
      // If we didn't drag much, treat it as a click!
      const elapsedX = Math.abs(e.clientX - (dragStartRef.current.x || 0))
      const elapsedY = Math.abs(e.clientY - (dragStartRef.current.y || 0))

      if (activeDraggedNodeRef.current && elapsedX < 3 && elapsedY < 3) {
        onNodeClick(activeDraggedNodeRef.current.id)
      }
    }

    dragStartRef.current = null
    activeDraggedNodeRef.current = null
    isPanningRef.current = false
  }

  const handleWheel = (e: React.WheelEvent): void => {
    e.preventDefault()
    const zoomIntensity = 0.05
    const zoomFactor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity

    setTransform((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.2), 4.0)
      return {
        ...prev,
        zoom: newZoom
      }
    })
  }

  // Navigation toolbar actions
  const handleReset = (): void => {
    setTransform({ x: 0, y: 0, zoom: 1.0 })
  }

  const handleZoomIn = (): void => {
    setTransform((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.15, 4.0) }))
  }

  const handleZoomOut = (): void => {
    setTransform((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.15, 0.2) }))
  }

  return (
    <div className="graph-container flex flex-1 flex-col bg-bg-primary relative overflow-hidden h-full">
      <div className="graph-title-overlay absolute top-4 left-6 pointer-events-none z-10">
        <div className="graph-title-text text-xl font-bold text-text-main tracking-tight">
          Graph View
        </div>
        <div className="graph-subtitle-text text-[11px] text-text-muted mt-0.5">
          {loading ? 'Analyzing link structure...' : `${nodes.length} notes, ${links.length} links`}
        </div>
      </div>

      <div className="graph-toolbar absolute top-4 right-4 bg-bg-sidebar/85 border border-border-color rounded p-1 flex gap-1 z-50 backdrop-blur-md shadow-lg">
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Refresh Graph"
          onClick={loadGraphData}
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Reset View"
          onClick={handleReset}
        >
          <Home size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Zoom In"
          onClick={handleZoomIn}
        >
          <ZoomIn size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Zoom Out"
          onClick={handleZoomOut}
        >
          <ZoomOut size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Close Graph"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <canvas
        className="graph-canvas-element block w-full h-full cursor-grab active:cursor-grabbing"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  )
}

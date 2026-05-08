'use client'

import { useRef, useEffect, useCallback } from 'react'
import { CanvasItem } from '@/lib/types'
import { redrawCanvas, hitTest, rotHandleHit } from '@/lib/canvas'

interface Props {
  items: CanvasItem[]
  selectedId: string | null
  bgColor: string
  bgImage?: HTMLImageElement | null
  bgFit?: 'cover' | 'contain'
  logicalW: number
  logicalH: number
  onSelectItem: (id: string | null) => void
  onUpdateItem: (id: string, updates: Partial<CanvasItem>) => void
  onReorderItem: (id: string, direction: 'front') => void
  hasGenerated: boolean
}

interface DragState {
  type: 'move' | 'rotate'
  itemId: string
  startX: number; startY: number
  origX: number; origY: number
  origRot: number
  pivotX: number; pivotY: number
}

export default function FlatLayCanvas({
  items, selectedId, bgColor, bgImage, bgFit = 'cover', logicalW, logicalH,
  onSelectItem, onUpdateItem, onReorderItem, hasGenerated,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  // Keep latest values accessible in event handlers without stale closures
  const latest = useRef({ items, selectedId, logicalW, logicalH })
  latest.current = { items, selectedId, logicalW, logicalH }

  // Convert a display-pixel point (from mouse event) → logical canvas coords
  const toLogical = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const { logicalW, logicalH } = latest.current
    // rect.width/height is the CSS display size
    const scaleX = logicalW / rect.width
    const scaleY = logicalH / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  // Resize canvas backing store & redraw whenever dims or container size change
  const setupAndDraw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const { logicalW, logicalH, items, selectedId } = latest.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const aspect = logicalW / logicalH

    // Fit canvas display size inside available container space
    const availW = wrap.clientWidth - 40
    const availH = wrap.clientHeight - 40
    let displayW: number, displayH: number
    if (availW / availH > aspect) {
      displayH = Math.min(availH, 760)
      displayW = displayH * aspect
    } else {
      displayW = Math.min(availW, 760)
      displayH = displayW / aspect
    }

    // Set CSS display size
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`

    // Set physical backing store = logical * dpr
    canvas.width = Math.round(logicalW * dpr)
    canvas.height = Math.round(logicalH * dpr)

    const ctx = canvas.getContext('2d')!
    redrawCanvas(ctx, items, selectedId, bgColor, logicalW, logicalH, dpr, bgImage, bgFit)
  }, [bgColor, bgImage, bgFit])

  // Redraw when items/selection/colors change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { logicalW, logicalH } = latest.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')!
    redrawCanvas(ctx, items, selectedId, bgColor, logicalW, logicalH, dpr, bgImage, bgFit)
  }, [items, selectedId, bgColor, bgImage, bgFit])

  // Re-setup canvas when dimensions change or container resizes
  useEffect(() => {
    setupAndDraw()
    const ro = new ResizeObserver(setupAndDraw)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [logicalW, logicalH, setupAndDraw])

  // ── Pointer events (all coords in logical space) ──────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const p = toLogical(e.nativeEvent)
    const { items, selectedId } = latest.current
    const sel = items.find(i => i.id === selectedId)

    if (sel && rotHandleHit(p.x, p.y, sel)) {
      dragRef.current = {
        type: 'rotate', itemId: sel.id,
        startX: p.x, startY: p.y,
        origX: sel.x, origY: sel.y, origRot: sel.rot,
        pivotX: sel.x, pivotY: sel.y,
      }
      return
    }

    const hit = hitTest(p.x, p.y, items)
    if (hit) {
      onSelectItem(hit.id)
      onReorderItem(hit.id, 'front')
      dragRef.current = {
        type: 'move', itemId: hit.id,
        startX: p.x, startY: p.y,
        origX: hit.x, origY: hit.y, origRot: hit.rot,
        pivotX: hit.x, pivotY: hit.y,
      }
    } else {
      onSelectItem(null)
    }
  }, [toLogical, onSelectItem, onReorderItem])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const p = toLogical(e.nativeEvent)
    const { logicalW, logicalH, items } = latest.current

    if (!dragRef.current) {
      canvas.style.cursor = hitTest(p.x, p.y, items) ? 'grab' : 'default'
      return
    }

    const d = dragRef.current
    if (d.type === 'move') {
      canvas.style.cursor = 'grabbing'
      // Soft clamp: allow slight overflow but keep item mostly visible
      const it = items.find(i => i.id === d.itemId)
      const margin = it ? (it.baseSize * it.scale) * 0.3 : 30
      const newX = Math.min(Math.max(d.origX + (p.x - d.startX), -margin), logicalW + margin)
      const newY = Math.min(Math.max(d.origY + (p.y - d.startY), -margin), logicalH + margin)
      onUpdateItem(d.itemId, { x: newX, y: newY })
    } else {
      const angle = Math.atan2(p.y - d.pivotY, p.x - d.pivotX)
      const startAngle = Math.atan2(d.startY - d.pivotY, d.startX - d.pivotX)
      onUpdateItem(d.itemId, { rot: d.origRot + (angle - startAngle), userRotated: true })
    }
  }, [toLogical, onUpdateItem])

  const onMouseUp = useCallback(() => {
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
    dragRef.current = null
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', overflow: 'hidden', position: 'relative', padding: 20,
      }}
    >
      <div style={{ position: 'relative', boxShadow: '0 8px 40px rgba(26,23,20,0.18)', flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ display: 'block' }}
        />
        {!hasGenerated && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, background: '#FAFAF6', pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 48, opacity: 0.2 }}>🎁</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
              Upload products · pick a layout · generate
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

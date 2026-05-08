import { CanvasItem } from './types'

export function getItemDims(item: CanvasItem): { dw: number; dh: number } {
  const sz = item.baseSize * item.scale
  return item.aspect >= 1
    ? { dw: sz, dh: sz / item.aspect }
    : { dh: sz, dw: sz * item.aspect }
}

// Draw a single item. ALL coordinates are in logical space.
// The ctx must already have dpr scale applied before calling this.
export function drawItem(
  ctx: CanvasRenderingContext2D,
  item: CanvasItem,
  isSelected: boolean
) {
  const { dw, dh } = getItemDims(item)
  ctx.save()
  ctx.translate(item.x, item.y)
  ctx.rotate(item.rot)
  if (item.flipH) ctx.scale(-1, 1)
  if (item.flipV) ctx.scale(1, -1)
  ctx.globalAlpha = item.opacity

  if (isSelected) {
    // Selection glow
    ctx.shadowColor = 'rgba(37,99,235,.3)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  } else if (item.shadow) {
    // Drop shadow for BG-removed items
    const intensity = item.shadowIntensity ?? 0.5
    ctx.shadowColor = `rgba(0,0,0,${intensity * 0.6})`
    ctx.shadowBlur = 24 * intensity
    ctx.shadowOffsetX = 4 * intensity
    ctx.shadowOffsetY = 8 * intensity
  } else {
    // Subtle ambient shadow always present
    ctx.shadowColor = 'rgba(0,0,0,.10)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 3
  }

  ctx.drawImage(item.img, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
}

// Draw selection handles. Called in logical space (after dpr scale applied).
export function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  item: CanvasItem
) {
  const { dw, dh } = getItemDims(item)
  const hw = dw / 2 + 9
  const hh = dh / 2 + 9
  ctx.save()
  ctx.translate(item.x, item.y)
  ctx.rotate(item.rot)

  ctx.strokeStyle = '#2563EB'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2)
  ctx.setLineDash([])

  const corners: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]
  corners.forEach(([x, y]) => {
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  ctx.strokeStyle = '#2563EB'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, -hh)
  ctx.lineTo(0, -hh - 12)
  ctx.stroke()

  ctx.fillStyle = '#2563EB'
  ctx.beginPath()
  ctx.arc(0, -hh - 17, 5, 0, Math.PI * 2)
  ctx.fill()

  if (item.isHero) {
    ctx.font = 'bold 16px serif'
    ctx.textAlign = 'center'
    ctx.fillText('👑', 0, -hh - 32)
  }
  ctx.restore()
}

// Compute draw rect for an image to fill a target box with cover/contain.
function fitRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  fit: 'cover' | 'contain'
): { x: number; y: number; w: number; h: number } {
  const imgAspect = imgW / imgH
  const boxAspect = boxW / boxH
  let w: number, h: number
  if (fit === 'cover'
    ? imgAspect > boxAspect
    : imgAspect < boxAspect) {
    // image wider than box → match height, crop sides (cover) / letterbox top-bottom (contain)
    h = boxH
    w = boxH * imgAspect
  } else {
    w = boxW
    h = boxW / imgAspect
  }
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

// Main redraw. Sets up dpr scale once, then everything is in logical coords.
export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  items: CanvasItem[],
  selectedId: string | null,
  bgColor: string,
  logicalW: number,
  logicalH: number,
  dpr: number,
  bgImage?: HTMLImageElement | null,
  bgFit: 'cover' | 'contain' = 'cover'
) {
  // Reset transform fully before each redraw
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, logicalW * dpr, logicalH * dpr)

  // Apply dpr scale ONCE — everything after this is in logical coords
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, logicalW, logicalH)
  }

  if (bgImage) {
    const r = fitRect(bgImage.naturalWidth, bgImage.naturalHeight, logicalW, logicalH, bgFit)
    ctx.drawImage(bgImage, r.x, r.y, r.w, r.h)
  }

  // Draw all non-selected items
  items.forEach(it => { if (it.id !== selectedId) drawItem(ctx, it, false) })

  // Draw selected item + handles on top
  const sel = items.find(x => x.id === selectedId)
  if (sel) {
    drawItem(ctx, sel, true)
    drawSelectionHandles(ctx, sel)
  }
}

// Hit test in logical coordinates
export function hitTest(x: number, y: number, items: CanvasItem[]): CanvasItem | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    const { dw, dh } = getItemDims(it)
    const dx = x - it.x, dy = y - it.y
    const cos = Math.cos(-it.rot), sin = Math.sin(-it.rot)
    const lx = dx * cos - dy * sin
    const ly = dx * sin + dy * cos
    if (Math.abs(lx) <= dw / 2 + 10 && Math.abs(ly) <= dh / 2 + 10) return it
  }
  return null
}

export function rotHandleHit(x: number, y: number, item: CanvasItem): boolean {
  const { dh } = getItemDims(item)
  const hh = dh / 2 + 9 + 17
  const hx = item.x - Math.sin(item.rot) * hh
  const hy = item.y - Math.cos(item.rot) * hh
  return Math.hypot(x - hx, y - hy) < 14
}

// Export to PNG at exact requested pixel dimensions
export function exportCanvas(
  items: CanvasItem[],
  exportW: number,
  exportH: number,
  exportBg: string,
  logicalW: number,
  logicalH: number,
  bgImage?: HTMLImageElement | null,
  bgFit: 'cover' | 'contain' = 'cover'
): string {
  const ec = document.createElement('canvas')
  ec.width = exportW
  ec.height = exportH
  const ectx = ec.getContext('2d')!

  if (exportBg !== 'transparent') {
    ectx.fillStyle = exportBg
    ectx.fillRect(0, 0, exportW, exportH)
  }

  // Background image is drawn in export-pixel space (no logical scaling), so
  // it fills the actual output dimensions and stays crisp.
  if (bgImage) {
    const r = fitRect(bgImage.naturalWidth, bgImage.naturalHeight, exportW, exportH, bgFit)
    ectx.drawImage(bgImage, r.x, r.y, r.w, r.h)
  }

  // Scale logical → export pixels uniformly, centering if aspect differs
  const scaleX = exportW / logicalW
  const scaleY = exportH / logicalH
  // For non-square exports, scale each axis independently to fill the canvas
  ectx.setTransform(scaleX, 0, 0, scaleY, 0, 0)

  items.forEach(it => {
    const { dw, dh } = getItemDims(it)
    ectx.save()
    ectx.translate(it.x, it.y)
    ectx.rotate(it.rot)
    if (it.flipH) ectx.scale(-1, 1)
    if (it.flipV) ectx.scale(1, -1)
    ectx.globalAlpha = it.opacity
    ectx.shadowColor = 'rgba(0,0,0,0.13)'
    ectx.shadowBlur = 22
    ectx.shadowOffsetX = 4
    ectx.shadowOffsetY = 7
    ectx.drawImage(it.img, -dw / 2, -dh / 2, dw, dh)
    ectx.restore()
  })

  return ec.toDataURL('image/png', 1.0)
}

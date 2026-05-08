'use client'

import { useState, useCallback, useRef } from 'react'
import { ProductImage, CanvasItem, ExportSettings, CanvasDimensions, ShadowMode } from '@/lib/types'
import { getLayoutPositions } from '@/lib/layouts'
import { exportCanvas } from '@/lib/canvas'
import { downscaleImageFile } from '@/lib/image'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import FlatLayCanvas from './FlatLayCanvas'
import ImagePreviewModal from './ImagePreviewModal'

const DEFAULT_LAYOUT = 'gb-anchor-left'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

export default function FlatLayStudio() {
  const [images, setImages] = useState<ProductImage[]>([])
  const [items, setItems] = useState<CanvasItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeLayout, setActiveLayout] = useState(DEFAULT_LAYOUT)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [rotVariance, setRotVariance] = useState(0)
  const [globalScale, setGlobalScale] = useState(0.8)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [previewImageId, setPreviewImageId] = useState<string | null>(null)
  const [canvasDims, setCanvasDims] = useState<CanvasDimensions>({ w: 1500, h: 1500 })
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    background: '#FFFFFF',
    backgroundImageId: null,
    backgroundFit: 'cover',
    linkedBg: true,
  })
  const [statusMsg, setStatusMsg] = useState('Ready — upload products to begin')
  const [statusColor, setStatusColor] = useState<'idle' | 'ok' | 'working'>('idle')

  const setStatus = (msg: string, color: typeof statusColor = 'idle') => {
    setStatusMsg(msg); setStatusColor(color)
  }

  // ── UPLOAD ──────────────────────────────────────────────────────────────────
  const handleFilesAdded = useCallback(async (files: FileList) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    for (const original of arr) {
      if (images.length >= 12) break
      const file = await downscaleImageFile(original)
      const dataUrl = await new Promise<string>(res => {
        const reader = new FileReader()
        reader.onload = e => res(e.target!.result as string)
        reader.readAsDataURL(file)
      })
      const img = await loadImage(dataUrl)
      const newImage: ProductImage = {
        id: `img-${Date.now()}-${Math.random()}`,
        file, dataUrl, cleanDataUrl: null,
        img, cleanImg: null,
        bgRemoved: false, bgRemoving: false, bgError: null,
        shadowMode: 'none' as ShadowMode,
      }
      setImages(prev => {
        const next = [...prev, newImage]
        setStatus(`${next.length} product${next.length !== 1 ? 's' : ''} loaded`, 'working')
        return next
      })
    }
  }, [images.length])

  // ── REMOVE IMAGE ────────────────────────────────────────────────────────────
  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => prev.filter(x => x.id !== id))
    setItems(prev => prev.filter(x => x.imageId !== id))
    if (selectedId) {
      const stillExists = items.some(x => x.id !== selectedId || x.imageId !== id)
      if (!stillExists) setSelectedId(null)
    }
    // Clear bg image if the removed image was set as backdrop
    setExportSettings(prev =>
      prev.backgroundImageId === id ? { ...prev, backgroundImageId: null } : prev
    )
  }, [items, selectedId])

  // ── BG REMOVAL VIA PHOTOROOM ────────────────────────────────────────────────
  const handleRemoveBg = useCallback(async (id: string, shadowMode?: ShadowMode) => {
    const image = images.find(x => x.id === id)
    if (!image || image.bgRemoving) return

    // Save the chosen shadow mode on the image record
    const chosenShadow = shadowMode ?? image.shadowMode ?? 'none'
    setImages(prev => prev.map(x => x.id === id
      ? { ...x, bgRemoving: true, bgError: null, shadowMode: chosenShadow }
      : x
    ))
    setStatus('Removing background…', 'working')

    try {
      const formData = new FormData()
      formData.append('image_file', image.file)
      formData.append('_shadowMode', chosenShadow)

      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || `Failed: ${res.status}`)
      }

      const blob = await res.blob()
      const cleanDataUrl = await new Promise<string>(res2 => {
        const reader = new FileReader()
        reader.onload = e => res2(e.target!.result as string)
        reader.readAsDataURL(blob)
      })
      const cleanImg = await loadImage(cleanDataUrl)

      setImages(prev => prev.map(x => x.id === id
        ? { ...x, bgRemoving: false, cleanDataUrl, cleanImg, bgRemoved: true, bgError: null }
        : x
      ))

      // Update any canvas items using this image to the clean version
      setItems(prev => prev.map(it => it.imageId === id
        ? { ...it, img: cleanImg }
        : it
      ))

      setStatus('Background removed ✓', 'ok')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setImages(prev => prev.map(x => x.id === id
        ? { ...x, bgRemoving: false, bgError: msg.length > 30 ? msg.slice(0, 30) + '…' : msg }
        : x
      ))
      setStatus(`BG removal failed: ${msg}`, 'idle')
    }
  }, [images])

  // ── CROP IMAGE — destructive replace, clears bg-removed state ────────────────
  const handleCropImage = useCallback(async (id: string, dataUrl: string) => {
    const image = images.find(x => x.id === id)
    if (!image) return
    const newImg = await loadImage(dataUrl)
    const newAspect = newImg.naturalWidth / newImg.naturalHeight
    // Convert dataUrl back to File so future bg-removal calls still work
    const blob = await (await fetch(dataUrl)).blob()
    const newFile = new File([blob], image.file.name.replace(/\.[^.]+$/, '') + '-cropped.png', {
      type: 'image/png',
    })
    setImages(prev => prev.map(x => x.id === id
      ? {
          ...x,
          file: newFile,
          dataUrl,
          img: newImg,
          cleanDataUrl: null,
          cleanImg: null,
          bgRemoved: false,
          bgError: null,
        }
      : x
    ))
    // Update placed items using this image: swap img + recompute aspect
    setItems(prev => prev.map(it => it.imageId === id
      ? { ...it, img: newImg, aspect: newAspect }
      : it
    ))
    setStatus('Cropped ✓ — re-run BG removal if needed', 'ok')
  }, [images])

  // ── TOGGLE BG REMOVE (use clean vs original) ─────────────────────────────────
  const handleToggleBgRemove = useCallback((id: string) => {
    setImages(prev => prev.map(x => {
      if (x.id !== id || !x.cleanImg) return x
      const next = { ...x, bgRemoved: !x.bgRemoved }
      // Also update canvas items
      setItems(items => items.map(it => it.imageId === id
        ? { ...it, img: next.bgRemoved ? x.cleanImg! : x.img }
        : it
      ))
      return next
    }))
  }, [])

  // ── GENERATE ────────────────────────────────────────────────────────────────
  const generate = useCallback((layout?: string, scale?: number, rot?: number, dims?: CanvasDimensions) => {
    const useLayout = layout ?? activeLayout
    const useScale = scale ?? globalScale
    const useRot = rot ?? rotVariance
    const useDims = dims ?? canvasDims

    if (images.length === 0) return
    setSelectedId(null)

    // Exclude any image currently used as the canvas backdrop from layout generation
    const layoutImages = images.filter(im => im.id !== exportSettings.backgroundImageId)
    if (layoutImages.length === 0) {
      setItems([])
      setHasGenerated(true)
      setStatus(`Backdrop set · upload more images to place on top`, 'ok')
      return
    }

    const positions = getLayoutPositions(useLayout, layoutImages.length, useDims.w, useDims.h)

    // Clamp a position so item center stays within canvas bounds with padding
    const clamp = (val: number, size: number, max: number) =>
      Math.min(Math.max(val, size * 0.3), max - size * 0.3)

    const newItems: CanvasItem[] = layoutImages.map((im, i) => {
      const pos = positions[i] ?? { x: useDims.w / 2, y: useDims.h / 2, size: 180 }
      const existingItem = items.find(it => it.imageId === im.id)
      const activeImg = im.bgRemoved && im.cleanImg ? im.cleanImg : im.img
      const aspect = activeImg.naturalWidth / activeImg.naturalHeight
      const baseSize = pos.size * useScale
      // Clamp position so item stays within canvas
      const halfW = baseSize * (aspect >= 1 ? 0.5 : 0.5 * aspect)
      const halfH = baseSize * (aspect >= 1 ? 0.5 / aspect : 0.5)
      const margin = Math.max(halfW, halfH)
      const preserveScale = existingItem?.userScaled ?? false
      const preserveRot = existingItem?.userRotated ?? false
      return {
        id: existingItem?.id ?? `item-${Date.now()}-${i}`,
        imageId: im.id,
        img: activeImg,
        x: Math.min(Math.max(pos.x, margin), useDims.w - margin),
        y: Math.min(Math.max(pos.y, margin), useDims.h - margin),
        baseSize,
        scale: preserveScale ? existingItem!.scale : 1,
        rot: preserveRot
          ? existingItem!.rot
          : i === 0 ? 0 : (Math.random() * 2 - 1) * useRot * Math.PI / 180,
        flipH: false, flipV: false,
        opacity: 1, aspect,
        isHero: i === 0,
        // Preserve shadow settings from previous layout if item existed
        shadow: existingItem?.shadow ?? false,
        shadowIntensity: existingItem?.shadowIntensity ?? 0.5,
        userScaled: preserveScale,
        userRotated: preserveRot,
      }
    })

    setItems(newItems)
    setHasGenerated(true)
    setStatus(`Generated · ${layoutImages.length} items · ${useLayout}`, 'ok')
  }, [images, activeLayout, globalScale, rotVariance, exportSettings.backgroundImageId])

  // ── LAYOUT CHANGE (auto-generate) ───────────────────────────────────────────
  const handleLayoutChange = useCallback((id: string) => {
    setActiveLayout(id)
    if (images.length > 0) generate(id)
  }, [images.length, generate])

  // ── SLIDER CHANGES (auto-regenerate) ────────────────────────────────────────
  const handleRotChange = useCallback((v: number) => {
    setRotVariance(v)
    if (images.length > 0) generate(undefined, undefined, v)
  }, [images.length, generate])

  const handleScaleChange = useCallback((v: number) => {
    const s = v / 100
    setGlobalScale(s)
    if (images.length > 0) generate(undefined, s)
  }, [images.length, generate])

  // ── CANVAS DIMS CHANGE ──────────────────────────────────────────────────────
  const handleCanvasDimsChange = useCallback((dims: CanvasDimensions) => {
    setCanvasDims(prev => {
      // If items exist, rescale their positions & sizes proportionally
      // so nothing flies off-screen when the canvas resizes
      setItems(prevItems => {
        if (prevItems.length === 0) return prevItems
        const scaleX = dims.w / prev.w
        const scaleY = dims.h / prev.h
        const scaleSize = Math.min(scaleX, scaleY)
        return prevItems.map(it => ({
          ...it,
          x: it.x * scaleX,
          y: it.y * scaleY,
          baseSize: it.baseSize * scaleSize,
        }))
      })
      return dims
    })
  }, [])

  // ── CLEAR ───────────────────────────────────────────────────────────────────
  // ── BG CHANGE — syncs preview + export when linked ────────────────────────
  const handleBgChange = useCallback((color: string) => {
    setBgColor(color)
    if (exportSettings.linkedBg) {
      setExportSettings(prev => ({ ...prev, background: color }))
    }
  }, [exportSettings.linkedBg])

  const handleExportSettingsChange = useCallback((s: ExportSettings) => {
    setExportSettings(s)
    // If linking was just turned on, sync preview bg to export bg
    if (s.linkedBg && !exportSettings.linkedBg) {
      setBgColor(s.background)
    }
    // If bg changed while linked, sync preview bg too
    if (s.linkedBg && s.background !== exportSettings.background) {
      setBgColor(s.background)
    }
  }, [exportSettings])

  // ── CLEAR ───────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setItems([]); setSelectedId(null); setHasGenerated(false)
    setStatus('Cleared', 'idle')
  }, [])

  // ── CANVAS ITEM UPDATES ─────────────────────────────────────────────────────
  const handleUpdateItem = useCallback((id: string, updates: Partial<CanvasItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it))
  }, [])

  const handleReorderItem = useCallback((id: string, direction: 'front') => {
    setItems(prev => {
      const item = prev.find(x => x.id === id)
      if (!item) return prev
      return [...prev.filter(x => x.id !== id), item]
    })
  }, [])

  // ── INSPECTOR ACTIONS ───────────────────────────────────────────────────────
  const selectedItem = items.find(x => x.id === selectedId) ?? null

  // ── BG IMAGE — use original (not bg-removed) source ─────────────────────────
  const bgImageEl = exportSettings.backgroundImageId
    ? images.find(x => x.id === exportSettings.backgroundImageId)?.img ?? null
    : null

  const handleSetBackgroundImage = useCallback((id: string | null) => {
    setExportSettings(prev => ({ ...prev, backgroundImageId: id }))
    // Remove any placed item using this image so it's not duplicated as backdrop + item
    if (id) setItems(prev => prev.filter(it => it.imageId !== id))
  }, [])

  const handleInspectorScale = (v: number) => handleUpdateItem(selectedId!, { scale: v / 100, userScaled: true })
  const handleInspectorRot = (v: number) => handleUpdateItem(selectedId!, { rot: v * Math.PI / 180, userRotated: true })
  const handleInspectorOpacity = (v: number) => handleUpdateItem(selectedId!, { opacity: v / 100 })
  const handleFlipH = () => selectedItem && handleUpdateItem(selectedId!, { flipH: !selectedItem.flipH })
  const handleFlipV = () => selectedItem && handleUpdateItem(selectedId!, { flipV: !selectedItem.flipV })
  const handleCenter = () => handleUpdateItem(selectedId!, { x: canvasDims.w / 2, y: canvasDims.h / 2 })
  const handleReset = () => handleUpdateItem(selectedId!, { scale: 1, rot: 0, flipH: false, flipV: false, opacity: 1, userScaled: false, userRotated: false })
  const handleBringForward = () => {
    setItems(prev => {
      const idx = prev.findIndex(x => x.id === selectedId)
      if (idx < prev.length - 1) {
        const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next
      }
      return prev
    })
  }
  const handleSendBack = () => {
    setItems(prev => {
      const idx = prev.findIndex(x => x.id === selectedId)
      if (idx > 0) {
        const next = [...prev]; [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]; return next
      }
      return prev
    })
  }
  const handleShadowToggle = () => {
    const it = items.find(x => x.id === selectedId)
    if (it) handleUpdateItem(selectedId!, { shadow: !it.shadow })
  }
  const handleShadowIntensity = (v: number) => {
    handleUpdateItem(selectedId!, { shadowIntensity: v / 100 })
  }

  const handleDeleteItem = () => {
    setItems(prev => prev.filter(x => x.id !== selectedId))
    setSelectedId(null)
  }

  // ── DOWNLOAD ────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!hasGenerated) return
    const prevSel = selectedId
    setSelectedId(null) // deselect to hide handles
    setTimeout(() => {
      const exportBg = exportSettings.linkedBg ? bgColor : exportSettings.background
      const dataUrl = exportCanvas(
        items,
        canvasDims.w, canvasDims.h,
        exportBg,
        canvasDims.w, canvasDims.h,
        bgImageEl,
        exportSettings.backgroundFit,
      )
      const a = document.createElement('a')
      a.download = `flatlay-${canvasDims.w}x${canvasDims.h}-${Date.now()}.png`
      a.href = dataUrl
      a.click()
      setSelectedId(prevSel)
      setStatus(`Downloaded ${canvasDims.w}×${canvasDims.h}px ✓`, 'ok')
    }, 50)
  }, [hasGenerated, items, exportSettings, selectedId, bgColor, canvasDims, bgImageEl])

  // ── PREVIEW MODAL ────────────────────────────────────────────────────────────
  const previewImage = images.find(x => x.id === previewImageId) ?? null

  // ── STATUS DOT ───────────────────────────────────────────────────────────────
  const dotColor = statusColor === 'ok' ? '#4CAF50' : statusColor === 'working' ? '#FF9800' : '#7A7066'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace" }}>
      {/* HEADER */}
      <header style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, letterSpacing: -0.5 }}>
          FlatLay Pro
        </h1>
        <span style={{
          fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1,
          padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 20,
        }}>
          Goodie Bag Studio
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>
          First image = hero bag · Drag items · Click to select & edit
        </span>
      </header>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftPanel
          images={images}
          activeLayout={activeLayout}
          bgColor={bgColor}
          rotVariance={rotVariance}
          globalScale={globalScale}
          backgroundImageId={exportSettings.backgroundImageId}
          onFilesAdded={handleFilesAdded}
          onLayoutChange={handleLayoutChange}
          onBgChange={handleBgChange}
          onRotChange={handleRotChange}
          onScaleChange={handleScaleChange}
          onRemoveImage={handleRemoveImage}
          onToggleBgRemove={handleToggleBgRemove}
          onRemoveBg={(id:any, shadowMode:any) => handleRemoveBg(id, shadowMode)}
          onPreview={setPreviewImageId}
          onGenerate={() => generate()}
          onClear={handleClear}
        />

        <FlatLayCanvas
          items={items}
          selectedId={selectedId}
          bgColor={bgColor}
          bgImage={bgImageEl}
          bgFit={exportSettings.backgroundFit}
          logicalW={canvasDims.w}
          logicalH={canvasDims.h}
          onSelectItem={setSelectedId}
          onUpdateItem={handleUpdateItem}
          onReorderItem={handleReorderItem}
          hasGenerated={hasGenerated}
        />

        <RightPanel
          selectedItem={selectedItem}
          exportSettings={exportSettings}
          images={images}
          onSetBackgroundImage={handleSetBackgroundImage}
          onScaleChange={handleInspectorScale}
          onRotChange={handleInspectorRot}
          onOpacityChange={handleInspectorOpacity}
          onFlipH={handleFlipH}
          onFlipV={handleFlipV}
          onCenter={handleCenter}
          onReset={handleReset}
          onBringForward={handleBringForward}
          onSendBack={handleSendBack}
          onDelete={handleDeleteItem}
          onShadowToggle={handleShadowToggle}
          onShadowIntensity={handleShadowIntensity}
          canvasDims={canvasDims}
          onExportSettingsChange={handleExportSettingsChange}
          onCanvasDimsChange={handleCanvasDimsChange}
          onDownload={handleDownload}
          hasGenerated={hasGenerated}
        />
      </div>

      {/* STATUS BAR */}
      <div style={{
        padding: '7px 20px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: 'var(--muted)', flexShrink: 0,
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: dotColor, marginRight: 5, verticalAlign: 'middle' }} />
          {statusMsg}
        </span>
        <span>
          {images.length} item{images.length !== 1 ? 's' : ''} · {activeLayout}
        </span>
      </div>

      {/* PREVIEW MODAL */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImageId(null)}
          onRemoveBg={(id, shadowMode) => handleRemoveBg(id, shadowMode)}
          onToggleBgRemove={handleToggleBgRemove}
          onCropImage={handleCropImage}
        />
      )}
    </div>
  )
}

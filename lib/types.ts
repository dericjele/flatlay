// Shadow style options for PhotoRoom API
export type ShadowMode = 'none' | 'ai.soft' | 'ai.hard' | 'ai.floating'

// A single uploaded product image
export interface ProductImage {
  id: string
  file: File
  dataUrl: string
  cleanDataUrl: string | null
  img: HTMLImageElement
  cleanImg: HTMLImageElement | null
  bgRemoved: boolean
  bgRemoving: boolean
  bgError: string | null
  shadowMode: ShadowMode   // shadow setting chosen before removal
}

// A placed item on the canvas
export interface CanvasItem {
  id: string
  imageId: string
  img: HTMLImageElement
  x: number
  y: number
  baseSize: number
  scale: number
  rot: number
  flipH: boolean
  flipV: boolean
  opacity: number
  aspect: number
  isHero: boolean
  shadow: boolean      // drop shadow (most useful after BG removal)
  shadowIntensity: number  // 0–1
  userScaled: boolean      // true once user manually scaled — preserved across regenerate
  userRotated: boolean     // true once user manually rotated — preserved across regenerate
}

// Layout definition
export interface Layout {
  id: string
  icon: string
  name: string
  cat: 'goodie' | 'classic'
}

// Canvas/export dimensions (logical units = export pixels)
export interface CanvasDimensions {
  w: number
  h: number
}

// Export / background settings
export interface ExportSettings {
  background: string                          // hex color or 'transparent' (used as fill / fallback)
  backgroundImageId: string | null            // id of an uploaded ProductImage used as backdrop, or null
  backgroundFit: 'cover' | 'contain'          // how the bg image fills the canvas
  linkedBg: boolean                           // true = preview bg and export bg are the same
}

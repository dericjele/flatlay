import { Layout } from './types'

// Curated shortlist — distinct compositional behaviors.
// Position-generating cases for dropped layouts remain in getLayoutPositions
// below so they can be re-enabled by adding entries back here.
export const LAYOUTS: Layout[] = [
  { id: 'gb-anchor-left',  icon: '🎁', name: 'Hero Left · Fan',     cat: 'goodie' },
  { id: 'gb-anchor-bl',    icon: '↗',  name: 'Hero Corner · Arc',   cat: 'goodie' },
  { id: 'gb-center-hero',  icon: '⭐', name: 'Center · Ring',        cat: 'goodie' },
  { id: 'gb-c-curve',      icon: '🌙', name: 'C-Curve Flow',         cat: 'goodie' },
  { id: 'grid',            icon: '⊞', name: 'Clean Grid',           cat: 'classic' },
  { id: 'scattered',       icon: '✦', name: 'Natural Scattered',    cat: 'classic' },
  { id: 'triangle',        icon: '▲', name: 'Triangle Depth',       cat: 'classic' },
  { id: 'minimal',         icon: '·', name: 'Minimal Focus',        cat: 'classic' },
]

export interface Position {
  x: number
  y: number
  size: number
}

export function getLayoutPositions(
  layout: string,
  n: number,
  W: number,
  H: number
): Position[] {
  const pad = 55, uw = W - pad * 2, uh = H - pad * 2
  const cx = W / 2, cy = H / 2
  const pts: Position[] = []

  switch (layout) {
    case 'gb-anchor-left': {
      const heroSize = uw * 0.38
      const heroX = pad + heroSize * 0.52
      const heroY = cy + uh * 0.1
      pts.push({ x: heroX, y: heroY, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      const rightStartX = heroX + heroSize * 0.6
      const rightW = W - rightStartX - pad * 0.5
      const rightH = H - pad * 1.5
      const cols = remain <= 2 ? 1 : remain <= 4 ? 2 : remain <= 6 ? 2 : 3
      const rows = Math.ceil(remain / cols)
      const cellW = rightW / cols, cellH = rightH / rows
      const iSize = Math.min(cellW, cellH) * 0.75
      for (let i = 0; i < remain; i++) {
        const col = i % cols, row = Math.floor(i / cols)
        pts.push({
          x: rightStartX + cellW * col + cellW / 2 + (Math.random() - .5) * 12,
          y: pad * 0.8 + cellH * row + cellH / 2 + (Math.random() - .5) * 12,
          size: iSize
        })
      }
      break
    }
    case 'gb-anchor-bl': {
      const heroSize = uw * 0.40
      pts.push({ x: pad + heroSize * .52, y: H - pad - heroSize * .48, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      const arcCx = W * 0.62, arcCy = H * 0.42
      const arcR = Math.min(uw, uh) * 0.32
      const iSize = uw * 0.19
      for (let i = 0; i < remain; i++) {
        const t = remain === 1 ? 0.5 : i / (remain - 1)
        const angle = (210 + t * 160) * Math.PI / 180
        const r = arcR * (0.85 + Math.random() * .3)
        pts.push({
          x: arcCx + Math.cos(angle) * r + (Math.random() - .5) * 18,
          y: arcCy + Math.sin(angle) * r + (Math.random() - .5) * 18,
          size: iSize * (0.8 + Math.random() * .4)
        })
      }
      break
    }
    case 'gb-center-hero': {
      const heroSize = uw * 0.35
      pts.push({ x: cx * 0.85, y: cy, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      const r = uw * 0.28, iSize = uw * 0.18
      for (let i = 0; i < remain; i++) {
        const t = remain === 1 ? 0.5 : i / (remain - 1)
        const angle = t * Math.PI * 2 - Math.PI / 4
        pts.push({
          x: cx * 0.85 + Math.cos(angle) * r + (Math.random() - .5) * 15,
          y: cy + Math.sin(angle) * r + (Math.random() - .5) * 15,
          size: iSize * (0.75 + Math.random() * .5)
        })
      }
      break
    }
    case 'gb-c-curve': {
      const heroSize = uw * 0.36
      pts.push({ x: pad + heroSize * .52, y: pad + heroSize * .52, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      for (let i = 0; i < remain; i++) {
        const t = remain === 1 ? 0.5 : i / (remain - 1)
        const angle = (-40 + t * 200) * Math.PI / 180
        const r = uw * 0.34 * (0.8 + Math.random() * .3)
        const iSize = uw * (0.14 + Math.random() * .08)
        pts.push({
          x: cx + Math.cos(angle) * r + (Math.random() - .5) * 20,
          y: cy + Math.sin(angle) * r + (Math.random() - .5) * 20,
          size: iSize
        })
      }
      break
    }
    case 'gb-fan-spread': {
      const heroSize = uw * 0.38
      const heroX = pad + heroSize * .52
      const heroY = cy + uh * .08
      pts.push({ x: heroX, y: heroY, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      const fanCx = W * 0.72, fanCy = cy
      const iSize = uw * 0.19
      for (let i = 0; i < remain; i++) {
        const t = remain === 1 ? 0.5 : i / (remain - 1)
        const angle = (180 - 60 + t * 120) * Math.PI / 180
        const r = uw * (0.2 + Math.random() * .12)
        pts.push({
          x: fanCx + Math.cos(angle) * r + (Math.random() - .5) * 15,
          y: fanCy + Math.sin(angle) * r + (Math.random() - .5) * 15,
          size: iSize * (0.8 + Math.random() * .4)
        })
      }
      break
    }
    case 'gb-top-scatter': {
      const heroSize = uw * 0.36
      pts.push({ x: cx, y: H - pad - heroSize * .5, size: heroSize })
      if (n === 1) break
      const remain = n - 1
      const iSize = uw * 0.18
      const placed: Position[] = []
      for (let i = 0; i < remain; i++) {
        let tries = 0, x = 0, y = 0
        do {
          x = pad + iSize * .5 + Math.random() * (uw - iSize)
          y = pad + iSize * .5 + Math.random() * (uh * 0.65)
          tries++
        } while (tries < 60 && placed.some(p => Math.hypot(p.x - x, p.y - y) < iSize * .65))
        placed.push({ x, y, size: iSize * (0.8 + Math.random() * .4) })
      }
      pts.push(...placed)
      break
    }
    case 'grid': {
      const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 9 ? 3 : 4
      const rows = Math.ceil(n / cols)
      const cw = uw / cols, ch = uh / rows
      const sz = Math.min(cw, ch) * 0.82
      for (let i = 0; i < n; i++) {
        const col = i % cols, row = Math.floor(i / cols)
        pts.push({ x: pad + cw * col + cw / 2 + (Math.random() - .5) * 8, y: pad + ch * row + ch / 2 + (Math.random() - .5) * 8, size: sz })
      }
      break
    }
    case 'scattered': {
      const sz = Math.min(uw, uh) / Math.max(Math.ceil(Math.sqrt(n)), 2) * .72
      const placed: Position[] = []
      for (let i = 0; i < n; i++) {
        let tries = 0, x = 0, y = 0
        do { x = pad + sz / 2 + Math.random() * (uw - sz); y = pad + sz / 2 + Math.random() * (uh - sz); tries++ }
        while (tries < 80 && placed.some(p => Math.hypot(p.x - x, p.y - y) < sz * .58))
        placed.push({ x, y, size: sz })
      }
      pts.push(...placed)
      break
    }
    case 'radial': {
      if (n === 1) { pts.push({ x: cx, y: cy, size: uw * .5 }); break }
      pts.push({ x: cx, y: cy, size: uw * .28 })
      const r = uw * .32, s = uw * .18
      for (let i = 1; i < n; i++) {
        const a = ((i - 1) / (n - 1)) * Math.PI * 2
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, size: s })
      }
      break
    }
    case 'diagonal': {
      const sz = uw / Math.max(n, 3) * 1.05
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? .5 : i / (n - 1)
        pts.push({ x: pad + sz / 2 + t * (uw - sz) + (Math.random() - .5) * 18, y: pad + sz / 2 + t * (uh - sz) + (Math.random() - .5) * 18, size: sz })
      }
      break
    }
    case 'thirds': {
      const xs = [W * .33, W * .67, W * .33, W * .67, W * .5, W * .2, W * .8]
      const ys = [H * .33, H * .33, H * .67, H * .67, H * .5, H * .5, H * .5]
      const sz = uw * .22
      for (let i = 0; i < n; i++) pts.push({ x: xs[i % 7], y: ys[i % 7], size: i === 0 ? sz * 1.3 : sz })
      break
    }
    case 'triangle': {
      const sz = uw * .24
      const anchors = [{ x: cx, y: pad + sz * .6 }, { x: pad + sz * .8, y: H - pad - sz * .6 }, { x: W - pad - sz * .8, y: H - pad - sz * .6 }, { x: cx, y: cy }, { x: cx - uw * .2, y: cy }, { x: cx + uw * .2, y: cy }]
      for (let i = 0; i < n; i++) { const a = anchors[i % anchors.length]; pts.push({ x: a.x + (Math.random() - .5) * 15, y: a.y + (Math.random() - .5) * 15, size: i === 0 ? sz * 1.25 : sz * .85 }) }
      break
    }
    case 'hero-left': {
      const hsz = uw * .42, ssz = uw * .19
      pts.push({ x: pad + hsz / 2 + 20, y: cy, size: hsz })
      const sx = pad + hsz + 35, rem = n - 1
      if (!rem) break
      const cols = Math.ceil(Math.sqrt(rem)), rows = Math.ceil(rem / cols)
      const cw = (W - sx - pad) / cols, ch = (H - pad * 2) / rows
      for (let i = 0; i < rem; i++) { const col = i % cols, row = Math.floor(i / cols); pts.push({ x: sx + (col + .5) * cw, y: pad + (row + .5) * ch, size: ssz }) }
      break
    }
    case 'overlap': {
      const sz = uw * .36
      const placed: Position[] = []
      for (let i = 0; i < n; i++) {
        let tries = 0, x = 0, y = 0
        do { x = pad + sz * .4 + Math.random() * (uw - sz * .8); y = pad + sz * .4 + Math.random() * (uh - sz * .8); tries++ }
        while (tries < 60 && !placed.some(p => Math.hypot(p.x - x, p.y - y) < sz * .42))
        placed.push({ x, y, size: sz * (0.85 + Math.random() * .3) })
      }
      pts.push(...placed)
      break
    }
    case 'zigzag': {
      const sz = uw / Math.max(n, 3) * .9
      for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1); pts.push({ x: pad + sz / 2 + t * (uw - sz), y: i % 2 === 0 ? cy - uh * .22 : cy + uh * .22, size: sz }) }
      break
    }
    case 'clusters': {
      const nc = Math.max(2, Math.ceil(n / 3))
      const cc = Array.from({ length: nc }, (_, c) => ({ x: pad + uw / (nc + 1) * (c + 1), y: cy + (c % 2 === 0 ? -uh * .15 : uh * .15) }))
      const sz = uw * .2
      for (let i = 0; i < n; i++) { const c = cc[i % nc]; pts.push({ x: c.x + (Math.random() - .5) * sz * .8, y: c.y + (Math.random() - .5) * sz * .8, size: sz * (0.8 + Math.random() * .4) }) }
      break
    }
    case 'symmetric': {
      const cols = n <= 2 ? n : n <= 6 ? 2 : 3
      const rows = Math.ceil(n / cols)
      const cw = uw / cols, ch = uh / rows, sz = Math.min(cw, ch) * .82
      for (let i = 0; i < n; i++) { const col = i % cols, row = Math.floor(i / cols); pts.push({ x: pad + cw * col + cw / 2, y: pad + ch * row + ch / 2, size: sz }) }
      break
    }
    case 'golden': {
      const sz = uw * .22
      const sp = [{ x: cx, y: cy }, { x: cx + uw * .22, y: cy }, { x: cx + uw * .22, y: cy - uh * .22 }, { x: cx - uw * .08, y: cy - uh * .22 }, { x: cx - uw * .08, y: cy + uh * .14 }, { x: cx + uw * .14, y: cy + uh * .14 }, { x: cx + uw * .28, y: cy + uh * .05 }]
      for (let i = 0; i < n; i++) { const s = sp[i % sp.length]; pts.push({ x: s.x + (Math.random() - .5) * 10, y: s.y + (Math.random() - .5) * 10, size: i === 0 ? sz * 1.4 : sz }) }
      break
    }
    case 'border': {
      const sz = uw * .16
      const steps = Math.max(n, 4)
      const perim: Position[] = []
      for (let i = 0; i < steps; i++) {
        const t = i / steps
        if (t < .25) perim.push({ x: pad + sz + (t / .25) * (uw - sz * 2), y: pad + sz / 2, size: sz })
        else if (t < .5) perim.push({ x: W - pad - sz / 2, y: pad + sz + ((t - .25) / .25) * (uh - sz * 2), size: sz })
        else if (t < .75) perim.push({ x: W - pad - sz - ((t - .5) / .25) * (uw - sz * 2), y: H - pad - sz / 2, size: sz })
        else perim.push({ x: pad + sz / 2, y: H - pad - sz - ((t - .75) / .25) * (uh - sz * 2), size: sz })
      }
      for (let i = 0; i < n; i++) pts.push({ ...perim[i % perim.length] })
      break
    }
    case 'minimal': {
      if (n === 1) { pts.push({ x: cx, y: cy, size: uw * .55 }); break }
      pts.push({ x: cx, y: cy, size: uw * .38 })
      const r = uw * .27, s = uw * .12
      for (let i = 1; i < n; i++) { const a = ((i - 1) / (n - 1)) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, size: s }) }
      break
    }
    default: {
      const cols = Math.ceil(Math.sqrt(n))
      const cw = uw / cols, ch = uh / Math.ceil(n / cols), sz = Math.min(cw, ch) * .82
      for (let i = 0; i < n; i++) pts.push({ x: pad + cw * (i % cols) + cw / 2, y: pad + ch * Math.floor(i / cols) + ch / 2, size: sz })
    }
  }
  return pts
}

// Cap on the longest edge after downscale. The export canvas tops out at
// 1500 px, so 2400 leaves headroom for retouches/zoom without bloating uploads.
const DEFAULT_MAX_EDGE = 2400

export async function downscaleImageFile(
  file: File,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = 0.92,
): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) {
    bitmap.close?.()
    return file
  }

  const scale = maxEdge / longEdge
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  // Preserve PNG (alpha) when source is PNG; otherwise re-encode as JPEG.
  const isPng = file.type === 'image/png'
  const outType = isPng ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, outType, isPng ? undefined : quality)
  })
  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const ext = isPng ? 'png' : 'jpg'
  return new File([blob], `${baseName}.${ext}`, {
    type: outType,
    lastModified: Date.now(),
  })
}

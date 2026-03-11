function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar imagen: ${imageUrl}`))
    image.src = imageUrl
  })
}

function get2dContext(canvas: HTMLCanvasElement | OffscreenCanvas): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo crear contexto 2D para procesamiento de PNG')
  }

  return context
}

export async function processGlassesPng(imageUrl: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageUrl)
  const canvas = createCanvas(img.width, img.height)
  const ctx = get2dContext(canvas)

  ctx.drawImage(img, 0, 0)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    if (brightness > 245) {
      data.data[i + 3] = 0
    } else if (brightness > 210) {
      data.data[i + 3] = Math.round(((245 - brightness) / 35) * 255)
    }
  }
  ctx.putImageData(data, 0, 0)

  const mask = createCanvas(canvas.width, canvas.height)
  const mCtx = get2dContext(mask)
  mCtx.filter = 'blur(1.5px)'
  mCtx.drawImage(canvas, 0, 0)
  mCtx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mask, 0, 0)
  ctx.restore()

  return canvas as unknown as HTMLCanvasElement
}

const processedCache = new Map<string, HTMLCanvasElement>()

export async function getCachedProcessedPng(url: string): Promise<HTMLCanvasElement> {
  const cached = processedCache.get(url)
  if (cached) {
    return cached
  }

  const processed = await processGlassesPng(url)
  processedCache.set(url, processed)
  return processed
}

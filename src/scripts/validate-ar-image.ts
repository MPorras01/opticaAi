/* eslint-disable no-console */

type PngInfo = {
  width: number
  height: number
  hasAlpha: boolean
}

function readUInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset)
}

function parsePng(buffer: Buffer): PngInfo {
  const pngSignature = '89504e470d0a1a0a'
  const signature = buffer.subarray(0, 8).toString('hex')

  if (signature !== pngSignature) {
    throw new Error('Archivo invalido: no es PNG')
  }

  let offset = 8
  let width = 0
  let height = 0
  let hasAlpha = false

  while (offset + 12 <= buffer.length) {
    const length = readUInt32BE(buffer, offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const dataStart = offset + 8
    const dataEnd = dataStart + length

    if (dataEnd + 4 > buffer.length) {
      throw new Error('PNG corrupto: chunk incompleto')
    }

    if (type === 'IHDR') {
      width = readUInt32BE(buffer, dataStart)
      height = readUInt32BE(buffer, dataStart + 4)
      const colorType = buffer[dataStart + 9]
      hasAlpha = colorType === 4 || colorType === 6
    }

    if (type === 'tRNS') {
      hasAlpha = true
    }

    if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4
  }

  if (!width || !height) {
    throw new Error('PNG invalido: no se encontro IHDR')
  }

  return { width, height, hasAlpha }
}

async function validateArImage(url: string) {
  console.log('Validando URL:', url)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`URL no accesible: HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('png') && !url.toLowerCase().includes('.png')) {
    throw new Error(`Formato inesperado: ${contentType || 'desconocido'}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const png = parsePng(buffer)

  console.log('Dimensiones:', `${png.width}x${png.height}`)
  console.log('Canal alpha:', png.hasAlpha ? 'SI' : 'NO')

  const minWidth = 800
  const minHeight = 400

  if (png.width < minWidth || png.height < minHeight) {
    throw new Error(
      `Resolucion insuficiente. Minimo requerido: ${minWidth}x${minHeight}, actual: ${png.width}x${png.height}`
    )
  }

  if (!png.hasAlpha) {
    throw new Error('No se detecto transparencia (canal alpha) en el PNG')
  }

  console.log('Validacion completada: imagen apta para AR')
}

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Uso: npx tsx src/scripts/validate-ar-image.ts "https://...png"')
    process.exit(1)
  }

  try {
    await validateArImage(url)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

void main()

import fs from 'fs'
import os from 'os'
import path from 'path'

import sharp from 'sharp'

/** Temp dir for generated seed assets. */
export const seedTmpDir = (): string => {
  const dir = path.join(os.tmpdir(), 'drzee-seed')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** Generate a solid brand-color placeholder JPEG and return its file path. */
export const makePlaceholderJpeg = async (
  name: string,
  background: { r: number; g: number; b: number },
  width = 1600,
  height = 900,
): Promise<string> => {
  const filePath = path.join(seedTmpDir(), name)
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .jpeg({ quality: 80 })
    .toFile(filePath)
  return filePath
}

/**
 * Generate a minimal one-page valid PDF (placeholder cookbook) by hand —
 * object offsets and the xref table are computed, so viewers open it cleanly.
 */
export const makePlaceholderPdf = (name: string, title: string): string => {
  const filePath = path.join(seedTmpDir(), name)

  const stream = `BT /F1 24 Tf 72 720 Td (${title.replace(/([()\\])/g, '\\$1')}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]

  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(body, 'utf8'))
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(body, 'utf8')
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  fs.writeFileSync(filePath, body + xref + trailer, 'utf8')
  return filePath
}

/**
 * Shrinks a photo in the browser before upload: saves the user's data and
 * re-encoding strips EXIF metadata, including GPS location.
 */
export async function compressImage(
  file: File,
  maxSize = 512,
  quality = 0.8,
): Promise<{ blob: Blob; extension: 'webp' | 'jpg' }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

  const webp = await encode('image/webp')
  if (webp?.type === 'image/webp') return { blob: webp, extension: 'webp' }
  const jpeg = await encode('image/jpeg')
  if (!jpeg) throw new Error('Could not process the image')
  return { blob: jpeg, extension: 'jpg' }
}

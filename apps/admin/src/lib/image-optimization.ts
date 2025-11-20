/**
 * Client-side image optimization utilities
 * Compresses, resizes, and converts images before upload
 */

export interface ImageOptimizationOptions {
  maxWidth?: number // Max width in pixels (default: 1920)
  maxHeight?: number // Max height in pixels (default: 1920)
  maxSizeMB?: number // Max file size in MB (default: 2)
  quality?: number // JPEG/WebP quality 0-1 (default: 0.8)
  format?: 'jpeg' | 'webp' | 'png' | 'auto' // Output format (default: 'webp')
}

export interface OptimizedImage {
  file: File
  preview: string // Data URL for preview
  originalSize: number
  optimizedSize: number
  width: number
  height: number
}

const DEFAULT_OPTIONS: Required<Omit<ImageOptimizationOptions, 'format'>> & { format: 'webp' | 'jpeg' | 'png' | 'auto' } = {
  maxWidth: 1920,
  maxHeight: 1920,
  maxSizeMB: 2,
  quality: 0.8,
  format: 'webp',
}

/**
 * Optimize an image file by resizing and compressing
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = file.size

  // Create image element to get dimensions
  const img = await loadImage(file)
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidth,
    opts.maxHeight
  )

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  ctx.drawImage(img, 0, 0, width, height)

  // Determine output format
  const outputFormat = getOutputFormat(file, opts.format)
  const mimeType = `image/${outputFormat}`

  // Convert to blob with compression
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to blob'))
          return
        }
        resolve(blob)
      },
      mimeType,
      opts.quality
    )
  })

  // If still too large, reduce quality further
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024
  let finalBlob = blob
  let finalQuality = opts.quality

  if (blob.size > maxSizeBytes && outputFormat !== 'png') {
    // Try reducing quality in steps
    for (let q = opts.quality; q > 0.3; q -= 0.1) {
      const compressed = await compressCanvas(canvas, mimeType, q)
      if (compressed.size <= maxSizeBytes || q <= 0.3) {
        finalBlob = compressed
        finalQuality = q
        break
      }
    }
  }

  // Create File from blob
  const optimizedFile = new File(
    [finalBlob],
    generateFileName(file.name, outputFormat),
    { type: mimeType }
  )

  // Create preview data URL
  const preview = canvas.toDataURL(mimeType, finalQuality)

  return {
    file: optimizedFile,
    preview,
    originalSize,
    optimizedSize: finalBlob.size,
    width,
    height,
  }
}

/**
 * Load an image file into an Image element
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

/**
 * Determine output format
 */
function getOutputFormat(
  originalFile: File,
  preferredFormat: string
): 'jpeg' | 'webp' | 'png' {
  // If PNG and needs transparency, keep as PNG
  if (originalFile.type === 'image/png' && preferredFormat === 'png') {
    return 'png'
  }

  // Prefer WebP for better compression (modern browsers support it)
  if (preferredFormat === 'webp' || preferredFormat === 'auto') {
    return 'webp'
  }

  // Fallback to JPEG
  return 'jpeg'
}

/**
 * Compress canvas to blob with specified quality
 */
function compressCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

/**
 * Generate optimized filename
 */
function generateFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const ext = format === 'jpeg' ? 'jpg' : format
  return `${nameWithoutExt}.${ext}`
}

/**
 * Validate image file before optimization
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }

  // Check file size (before optimization, allow up to 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB`,
    }
  }

  return { valid: true }
}


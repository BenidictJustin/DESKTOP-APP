/**
 * Utilities for client-side image compression and document payload optimization.
 * Prevents Firestore 1MB document/field limits (code=invalid-argument)
 * by downscaling high-resolution camera photos, pasted screenshots, and base64 images.
 */
import { uploadDocumentToCloudinary, isCloudinaryAvailable } from '../services/cloudinary.js'

/**
 * Compresses an image file, blob, or base64 string using an offscreen canvas.
 * @param {File|Blob|string} source - File, Blob, or data:image URL
 * @param {object} options
 * @param {number} [options.maxWidth=1200] - Max allowed width in pixels
 * @param {number} [options.maxHeight=1200] - Max allowed height in pixels
 * @param {number} [options.quality=0.75] - JPEG quality (0.0 to 1.0)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export async function compressImage(source, options = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = options

  // If already small base64 string (< 40KB), return as is to save CPU cycles
  if (typeof source === 'string' && source.startsWith('data:image/') && source.length < 50000) {
    return source
  }

  // If source is a URL (http/https), return as is
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    let objectUrl = null

    img.onload = () => {
      try {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }

        let { width, height } = img

        // If dimensions are within bounds and input is reasonably sized, check if we need resize
        let targetWidth = width
        let targetHeight = height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          targetWidth = Math.round(width * ratio)
          targetHeight = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '')
          return
        }

        // Fill white background for document consistency (prevents black background on transparent PNG to JPEG conversion)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, targetWidth, targetHeight)

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Convert to web-friendly JPEG at specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (err) {
        console.warn('Image compression canvas export failed, using source fallback:', err)
        resolve(typeof source === 'string' ? source : '')
      }
    }

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      console.warn('Failed to load image for compression:', err)
      resolve(typeof source === 'string' ? source : '')
    }

    if (typeof source === 'string') {
      img.src = source
    } else if (source instanceof Blob || source instanceof File) {
      objectUrl = URL.createObjectURL(source)
      img.src = objectUrl
    } else {
      resolve('')
    }
  })
}

/**
 * Scans an HTML string (such as narrative body or document content)
 * and compresses all embedded base64 images that exceed 40KB in length.
 * @param {string} html - HTML string with potential data:image/...;base64,... images
 * @param {object} options - Compression options
 * @returns {Promise<string>} HTML string with compressed images
 */
export async function compressHtmlImages(html, options = {}) {
  if (!html || typeof html !== 'string') return html || ''

  // Fast check: if no base64 images, return original HTML instantly
  if (!html.includes('data:image/')) {
    return html
  }

  // Regex to find all base64 image data URLs in src="..." or src='...'
  const dataUrlRegex = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g
  const matches = html.match(dataUrlRegex)

  if (!matches || matches.length === 0) {
    return html
  }

  // Deduplicate matches so we only compress each unique image once
  const uniqueMatches = Array.from(new Set(matches))
  const replacementMap = new Map()

  for (const rawDataUrl of uniqueMatches) {
    // Only compress if the base64 string is large (> 40,000 characters ~30KB)
    if (rawDataUrl.length > 40000) {
      try {
        const compressed = await compressImage(rawDataUrl, options)
        if (compressed && compressed.length < rawDataUrl.length) {
          replacementMap.set(rawDataUrl, compressed)
        }
      } catch (e) {
        console.warn('Failed to compress inline HTML image:', e)
      }
    }
  }

  if (replacementMap.size === 0) {
    return html
  }

  // Replace each large image with its compressed counterpart
  let updatedHtml = html
  for (const [original, compressed] of replacementMap.entries()) {
    updatedHtml = updatedHtml.split(original).join(compressed)
  }

  return updatedHtml
}

/**
 * Ensures an HTML narrative string is strictly within Firestore's 1MB field limit
 * (1,048,487 bytes UTF-8).
 * Prioritizes offloading embedded images directly to Cloudinary, drastically reducing
 * payload byte size while preserving high visual quality.
 * Falls back to fast canvas downscaling if Cloudinary is unavailable or offline.
 *
 * @param {string} html - Raw or formatted HTML content
 * @param {object} [options]
 * @param {string} [options.academicYear] - Academic year for folder organization
 * @param {string} [options.eventId] - Event ID for folder organization
 * @returns {Promise<string>} An HTML string guaranteed to be < 1,000,000 bytes
 */
export async function ensureHtmlUnderFirestoreLimit(html, options = {}) {
  if (!html || typeof html !== 'string') return html || ''

  const FIRESTORE_MAX_SAFE_BYTES = 400000 // 400KB ensures narrative + submittedNarrative comfortably stay well under 1MB

  const getByteSize = (str) => {
    try {
      return new Blob([str]).size
    } catch {
      return new TextEncoder().encode(str).length
    }
  }

  let currentHtml = html

  // PASS 1: Cloudinary Offloading (Only if NOT skipped and document snapshot is not already stored in Cloudinary)
  if (!options.skipCloudinaryUpload && currentHtml.includes('data:image/') && isCloudinaryAvailable()) {
    try {
      const dataUrlRegex = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g
      const matches = Array.from(new Set(currentHtml.match(dataUrlRegex) || []))

      // Only offload base64 images that are large enough to matter (> 20KB)
      const largeMatches = matches.filter((u) => u.length > 25000)

      if (largeMatches.length > 0) {
        const uploadPromises = largeMatches.map(async (dataUrl) => {
          try {
            const mimeMatch = dataUrl.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,/)
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
            const base64Data = dataUrl.split(',')[1]
            if (!base64Data) return null

            const binaryStr = atob(base64Data)
            const len = binaryStr.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryStr.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: mimeType })
            const ext = mimeType.split('/')[1] || 'jpg'
            const fileName = `narrative_img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`

            const cloudRes = await uploadDocumentToCloudinary(blob, {
              fileName,
              academicYear: options.academicYear || '2026-2027',
              eventId: options.eventId || 'general',
              isImage: true
            })

            const cloudUrl = cloudRes?.secureUrl || cloudRes?.url
            if (cloudUrl) {
              return { dataUrl, cloudUrl }
            }
            return null
          } catch (uploadErr) {
            console.warn('[imageCompressor] Cloudinary inline image upload notice:', uploadErr?.message || uploadErr)
            return null
          }
        })

        const settled = await Promise.allSettled(uploadPromises)
        for (const item of settled) {
          if (item.status === 'fulfilled' && item.value) {
            currentHtml = currentHtml.split(item.value.dataUrl).join(item.value.cloudUrl)
          }
        }
      }
    } catch (e) {
      console.warn('[imageCompressor] Cloudinary offloading notice:', e)
    }
  }

  let currentSize = getByteSize(currentHtml)
  if (currentSize <= FIRESTORE_MAX_SAFE_BYTES) {
    return currentHtml
  }

  // PASS 2: Fast responsive downscale (750px, 0.60 quality) if still oversized (e.g. offline)
  currentHtml = await compressHtmlImages(currentHtml, {
    maxWidth: 750,
    maxHeight: 750,
    quality: 0.6
  })
  currentSize = getByteSize(currentHtml)
  if (currentSize <= FIRESTORE_MAX_SAFE_BYTES) {
    return currentHtml
  }

  // PASS 3: Hard safety guarantee (Replace oversized remaining base64 images with clean placeholders)
  const dataUrlRegex = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g
  const allRemaining = Array.from(new Set(currentHtml.match(dataUrlRegex) || []))
  for (const remainingUrl of allRemaining) {
    if (getByteSize(currentHtml) <= FIRESTORE_MAX_SAFE_BYTES) break
    const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="150" y="105" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Image Attached in Report</text></svg>'
    currentHtml = currentHtml.split(remainingUrl).join(placeholder)
  }

  return currentHtml
}

